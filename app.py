import os
import asyncio
from flask import Flask, render_template, request, redirect, url_for, session, flash
from config import Config
from models import db, Admin, Category, Product, ProductImage, SiteSettings
from werkzeug.utils import secure_filename
from vercel.blob import AsyncBlobClient
from PIL import Image
from io import BytesIO


def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)
    app.config["UPLOAD_FOLDER"] = os.path.join(app.root_path, "static", "uploads")
    app.config["ALLOWED_IMAGE_EXTENSIONS"] = {"png", "jpg", "jpeg", "webp"}
    app.config["MAX_CONTENT_LENGTH"] = 8 * 1024 * 1024

    db.init_app(app)

    def compress_image(file_storage, max_size=(1200, 1200), quality=78):
        """
        Compress uploaded image before saving/uploading.

        - Resizes image so width/height does not exceed max_size
        - Converts image to JPEG
        - Reduces file size using quality setting
        - Returns compressed bytes
        """

        image = Image.open(file_storage)

        # Convert transparent images safely to RGB
        if image.mode in ("RGBA", "P"):
            image = image.convert("RGB")

        # Resize while keeping aspect ratio
        image.thumbnail(max_size)

        output = BytesIO()

        image.save(
            output,
            format="JPEG",
            quality=quality,
            optimize=True
        )

        output.seek(0)

        return output

    async def upload_to_blob_async(file_bytes, pathname):
        client = AsyncBlobClient()

        blob = await client.put(
            pathname,
            file_bytes.read(),
            access="public",
            add_random_suffix=True,
        )

        return blob.url

    def upload_to_blob(file_bytes, pathname):
        try:
            return asyncio.run(upload_to_blob_async(file_bytes, pathname))
        except Exception as error:
            print("Blob upload failed:", error)
            return None

    def allowed_image(filename):
        return (
                "." in filename
                and filename.rsplit(".", 1)[1].lower() in app.config["ALLOWED_IMAGE_EXTENSIONS"]
        )

    def slugify(text):
        return (
            text.lower()
            .strip()
            .replace(" ", "-")
            .replace("/", "-")
            .replace("&", "and")
        )

    def admin_required():
        return bool(session.get("admin_id"))

    @app.route("/")
    def index():
        settings = SiteSettings.query.first()
        featured_products = Product.query.filter_by(is_featured=True).limit(4).all()
        categories = Category.query.limit(8).all()

        return render_template(
            "index.html",
            settings=settings,
            featured_products=featured_products,
            categories=categories
        )

    @app.route("/catalogue")
    def catalogue():
        settings = SiteSettings.query.first()
        categories = Category.query.order_by(Category.name.asc()).all()

        search = request.args.get("search", "").strip()
        selected_category = request.args.get("category", "").strip()

        query = Product.query

        if search:
            query = query.filter(
                Product.name.ilike(f"%{search}%") |
                Product.description.ilike(f"%{search}%")
            )

        current_category = None

        if selected_category:
            current_category = Category.query.filter_by(slug=selected_category).first()

            if current_category:
                query = query.filter_by(category_id=current_category.id)

        page = request.args.get("page", 1, type=int)
        per_page = 8

        pagination = query.order_by(Product.created_at.desc()).paginate(
            page=page,
            per_page=per_page,
            error_out=False
        )

        products = pagination.items

        return render_template(
            "catalogue.html",
            products=products,
            categories=categories,
            settings=settings,
            search=search,
            selected_category=selected_category,
            current_category=current_category,
            pagination=pagination
        )

    @app.route("/product/<slug>")
    def product_detail(slug):
        product = Product.query.filter_by(slug=slug).first_or_404()
        settings = SiteSettings.query.first()

        return render_template(
            "product_detail.html",
            product=product,
            settings=settings
        )

    @app.route("/admin/login", methods=["GET", "POST"])
    def admin_login():
        settings = SiteSettings.query.first()

        if request.method == "POST":
            email = request.form.get("email", "").strip().lower()
            password = request.form.get("password", "")

            admin = Admin.query.filter_by(email=email).first()

            if admin and admin.check_password(password):
                session["admin_id"] = admin.id
                session["admin_email"] = admin.email
                flash("Login successful.", "success")
                return redirect(url_for("admin_dashboard"))

            flash("Invalid email or password.", "error")

        return render_template("admin/login.html", settings=settings)

    @app.route("/admin/dashboard")
    def admin_dashboard():
        if not session.get("admin_id"):
            flash("Please log in to access the admin dashboard.", "error")
            return redirect(url_for("admin_login"))

        settings = SiteSettings.query.first()

        total_products = Product.query.count()
        available_products = Product.query.filter_by(is_available=True).count()
        sold_out_products = Product.query.filter_by(is_available=False).count()
        featured_products = Product.query.filter_by(is_featured=True).count()

        recent_products = Product.query.order_by(Product.created_at.desc()).limit(5).all()

        return render_template(
            "admin/dashboard.html",
            settings=settings,
            total_products=total_products,
            available_products=available_products,
            sold_out_products=sold_out_products,
            featured_products=featured_products,
            recent_products=recent_products
        )

    @app.route("/admin/products")
    def admin_products():
        if not admin_required():
            flash("Please log in to manage products.", "error")
            return redirect(url_for("admin_login"))

        settings = SiteSettings.query.first()

        products = Product.query.order_by(Product.created_at.desc()).all()

        return render_template(
            "admin/products.html",
            settings=settings,
            products=products
        )

    @app.route("/admin/products/add", methods=["GET", "POST"])
    def admin_add_product():
        if not admin_required():
            flash("Please log in to add products.", "error")
            return redirect(url_for("admin_login"))

        settings = SiteSettings.query.first()
        categories = Category.query.order_by(Category.name.asc()).all()

        if request.method == "POST":
            name = request.form.get("name", "").strip()
            description = request.form.get("description", "").strip()
            price = request.form.get("price", "").strip()
            sizes = request.form.get("sizes", "").strip()
            category_id = request.form.get("category_id")
            is_available = True if request.form.get("is_available") == "on" else False
            is_featured = True if request.form.get("is_featured") == "on" else False

            if not name or not price or not category_id:
                flash("Product name, price, and category are required.", "error")
                return redirect(url_for("admin_add_product"))

            try:
                price = int(price)
            except ValueError:
                flash("Price must be a valid number.", "error")
                return redirect(url_for("admin_add_product"))

            if not sizes:
                sizes = "S,M,L,XL,XXL"

            base_slug = slugify(name)
            slug = base_slug
            counter = 1

            while Product.query.filter_by(slug=slug).first():
                slug = f"{base_slug}-{counter}"
                counter += 1

            image_files = request.files.getlist("images")
            saved_images = []

            for index, image_file in enumerate(image_files):
                if image_file and image_file.filename:
                    if not allowed_image(image_file.filename):
                        flash("Only PNG, JPG, JPEG, and WEBP images are allowed.", "error")
                        return redirect(url_for("admin_add_product"))

                    filename = secure_filename(image_file.filename)
                    filename_without_ext = os.path.splitext(filename)[0]
                    filename = f"{slug}-{index + 1}-{filename_without_ext}.jpg"

                    compressed_image = compress_image(image_file)

                    blob_path = f"products/{slug}/{filename}"
                    image_url = upload_to_blob(compressed_image, blob_path)

                    if not image_url:
                        flash("Image upload failed. Please try again.", "error")
                        return redirect(url_for("admin_add_product"))

                    saved_images.append(image_url)

            image_url = saved_images[0] if saved_images else None

            product = Product(
                name=name,
                slug=slug,
                description=description,
                price=price,
                category_id=category_id,
                is_available=is_available,
                is_featured=is_featured,
                image_url=image_url,
                sizes=sizes,
            )

            db.session.add(product)
            db.session.commit()

            for index, image_url_item in enumerate(saved_images):
                product_image = ProductImage(
                    product_id=product.id,
                    image_url=image_url_item,
                    is_main=True if index == 0 else False
                )
                db.session.add(product_image)

            db.session.commit()

            flash("Product added successfully.", "success")
            return redirect(url_for("admin_products"))

        return render_template(
            "admin/add_product.html",
            settings=settings,
            categories=categories
        )

    @app.route("/admin/products/edit/<int:product_id>", methods=["GET", "POST"])
    def admin_edit_product(product_id):
        if not admin_required():
            flash("Please log in to edit products.", "error")
            return redirect(url_for("admin_login"))

        settings = SiteSettings.query.first()
        product = Product.query.get_or_404(product_id)
        categories = Category.query.order_by(Category.name.asc()).all()

        if request.method == "POST":
            name = request.form.get("name", "").strip()
            description = request.form.get("description", "").strip()
            price = request.form.get("price", "").strip()
            sizes = request.form.get("sizes", "").strip()
            category_id = request.form.get("category_id")
            is_available = True if request.form.get("is_available") == "on" else False
            is_featured = True if request.form.get("is_featured") == "on" else False

            if not name or not price or not category_id:
                flash("Product name, price, and category are required.", "error")
                return redirect(url_for("admin_edit_product", product_id=product.id))

            try:
                price = int(price)
            except ValueError:
                flash("Price must be a valid number.", "error")
                return redirect(url_for("admin_edit_product", product_id=product.id))

            if not sizes:
                sizes = "S,M,L,XL,XXL"

            image_files = request.files.getlist("images")
            saved_images = []

            for index, image_file in enumerate(image_files):
                if image_file and image_file.filename:
                    if not allowed_image(image_file.filename):
                        flash("Only PNG, JPG, JPEG, and WEBP images are allowed.", "error")
                        return redirect(url_for("admin_edit_product", product_id=product.id))

                    filename = secure_filename(image_file.filename)
                    filename_without_ext = os.path.splitext(filename)[0]
                    filename = f"{product.slug}-{index + 1}-{filename_without_ext}.jpg"

                    compressed_image = compress_image(image_file)

                    blob_path = f"products/{product.slug}/{filename}"
                    image_url = upload_to_blob(compressed_image, blob_path)

                    if not image_url:
                        flash("Image upload failed. Please try again.", "error")
                        return redirect(url_for("admin_edit_product", product_id=product.id))

                    saved_images.append(image_url)

            if saved_images:
                ProductImage.query.filter_by(product_id=product.id).delete()

                for index, image_url_item in enumerate(saved_images):
                    product_image = ProductImage(
                        product_id=product.id,
                        image_url=image_url_item,
                        is_main=True if index == 0 else False
                    )
                    db.session.add(product_image)

                product.image_url = saved_images[0]

            product.name = name
            product.description = description
            product.price = price
            product.category_id = category_id
            product.is_available = is_available
            product.is_featured = is_featured
            product.sizes = sizes

            db.session.commit()

            flash("Product updated successfully.", "success")
            return redirect(url_for("admin_products"))

        return render_template(
            "admin/edit_product.html",
            settings=settings,
            product=product,
            categories=categories
        )

    @app.route("/admin/products/delete/<int:product_id>", methods=["POST"])
    def admin_delete_product(product_id):
        if not admin_required():
            flash("Please log in to delete products.", "error")
            return redirect(url_for("admin_login"))

        product = Product.query.get_or_404(product_id)

        db.session.delete(product)
        db.session.commit()

        flash("Product deleted successfully.", "success")
        return redirect(url_for("admin_products"))

    @app.route("/admin/categories")
    def admin_categories():
        if not admin_required():
            flash("Please log in to manage categories.", "error")
            return redirect(url_for("admin_login"))

        settings = SiteSettings.query.first()
        categories = Category.query.order_by(Category.name.asc()).all()

        return render_template(
            "admin/categories.html",
            settings=settings,
            categories=categories
        )

    @app.route("/admin/categories/add", methods=["GET", "POST"])
    def admin_add_category():
        if not admin_required():
            flash("Please log in to add categories.", "error")
            return redirect(url_for("admin_login"))

        settings = SiteSettings.query.first()

        if request.method == "POST":
            name = request.form.get("name", "").strip()

            if not name:
                flash("Category name is required.", "error")
                return redirect(url_for("admin_add_category"))

            existing_category = Category.query.filter_by(name=name).first()

            if existing_category:
                flash("A category with this name already exists.", "error")
                return redirect(url_for("admin_add_category"))

            base_slug = slugify(name)
            slug = base_slug
            counter = 1

            while Category.query.filter_by(slug=slug).first():
                slug = f"{base_slug}-{counter}"
                counter += 1

            category = Category(
                name=name,
                slug=slug
            )

            db.session.add(category)
            db.session.commit()

            flash("Category added successfully.", "success")
            return redirect(url_for("admin_categories"))

        return render_template(
            "admin/add_category.html",
            settings=settings
        )

    @app.route("/admin/categories/edit/<int:category_id>", methods=["GET", "POST"])
    def admin_edit_category(category_id):
        if not admin_required():
            flash("Please log in to edit categories.", "error")
            return redirect(url_for("admin_login"))

        settings = SiteSettings.query.first()
        category = Category.query.get_or_404(category_id)

        if request.method == "POST":
            name = request.form.get("name", "").strip()

            if not name:
                flash("Category name is required.", "error")
                return redirect(url_for("admin_edit_category", category_id=category.id))

            existing_category = Category.query.filter(
                Category.name == name,
                Category.id != category.id
            ).first()

            if existing_category:
                flash("Another category with this name already exists.", "error")
                return redirect(url_for("admin_edit_category", category_id=category.id))

            category.name = name
            category.slug = slugify(name)

            db.session.commit()

            flash("Category updated successfully.", "success")
            return redirect(url_for("admin_categories"))

        return render_template(
            "admin/edit_category.html",
            settings=settings,
            category=category
        )

    @app.route("/admin/categories/delete/<int:category_id>", methods=["POST"])
    def admin_delete_category(category_id):
        if not admin_required():
            flash("Please log in to delete categories.", "error")
            return redirect(url_for("admin_login"))

        category = Category.query.get_or_404(category_id)

        if category.products:
            flash("This category cannot be deleted because products are still using it.", "error")
            return redirect(url_for("admin_categories"))

        db.session.delete(category)
        db.session.commit()

        flash("Category deleted successfully.", "success")
        return redirect(url_for("admin_categories"))

    @app.route("/admin/settings", methods=["GET", "POST"])
    def admin_settings():
        if not admin_required():
            flash("Please log in to manage settings.", "error")
            return redirect(url_for("admin_login"))

        settings = SiteSettings.query.first()

        if not settings:
            settings = SiteSettings()
            db.session.add(settings)
            db.session.commit()

        if request.method == "POST":
            business_name = request.form.get("business_name", "").strip()
            whatsapp_number = request.form.get("whatsapp_number", "").strip()
            instagram_url = request.form.get("instagram_url", "").strip()
            location = request.form.get("location", "").strip()
            about_text = request.form.get("about_text", "").strip()
            hero_text = request.form.get("hero_text", "").strip()
            hero_image = request.files.get("hero_image")
            delivery_note = request.form.get("delivery_note", "").strip()
            payment_note = request.form.get("payment_note", "").strip()

            if not business_name:
                flash("Business name is required.", "error")
                return redirect(url_for("admin_settings"))

            settings.business_name = business_name
            settings.whatsapp_number = whatsapp_number
            settings.instagram_url = instagram_url
            settings.location = location
            settings.about_text = about_text
            settings.hero_text = hero_text
            settings.delivery_note = delivery_note
            settings.payment_note = payment_note

            if hero_image and hero_image.filename:
                if not allowed_image(hero_image.filename):
                    flash("Only PNG, JPG, JPEG, and WEBP images are allowed for the section image.", "error")
                    return redirect(url_for("admin_settings"))

                filename = secure_filename(hero_image.filename)
                filename_without_ext = os.path.splitext(filename)[0]
                filename = f"hero-{filename_without_ext}.jpg"

                compressed_image = compress_image(hero_image, max_size=(1600, 1000), quality=80)

                blob_path = f"settings/hero/{filename}"
                hero_image_url = upload_to_blob(compressed_image, blob_path)

                if not hero_image_url:
                    flash("Homepage image upload failed. Please try again.", "error")
                    return redirect(url_for("admin_settings"))

                settings.hero_image_url = hero_image_url

            db.session.commit()

            flash("Settings updated successfully.", "success")
            return redirect(url_for("admin_settings"))

        return render_template(
            "admin/settings.html",
            settings=settings
        )

    @app.route("/admin/logout")
    def admin_logout():
        session.pop("admin_id", None)
        session.pop("admin_email", None)
        flash("You have been logged out.", "success")
        return redirect(url_for("admin_login"))

    return app


app = create_app()

if __name__ == "__main__":
    app.run(debug=True)
