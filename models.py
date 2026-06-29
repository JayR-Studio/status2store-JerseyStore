from flask_sqlalchemy import SQLAlchemy
from datetime import datetime, UTC
from werkzeug.security import generate_password_hash, check_password_hash


db = SQLAlchemy()


class Admin(db.Model):
    __tablename__ = "admins"

    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(150), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(UTC))

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)


class Category(db.Model):
    __tablename__ = "categories"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), unique=True, nullable=False)
    slug = db.Column(db.String(120), unique=True, nullable=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(UTC))

    products = db.relationship("Product", backref="category", lazy=True)


class Product(db.Model):
    __tablename__ = "products"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(150), nullable=False)
    slug = db.Column(db.String(180), unique=True, nullable=False)
    description = db.Column(db.Text, nullable=True)
    sizes = db.Column(db.String(200), default="S,M,L,XL,XXL")
    price = db.Column(db.Integer, nullable=False)
    image_url = db.Column(db.String(500), nullable=True)

    is_available = db.Column(db.Boolean, default=True)
    is_featured = db.Column(db.Boolean, default=False)

    category_id = db.Column(db.Integer, db.ForeignKey("categories.id"), nullable=False)
    images = db.relationship(
        "ProductImage",
        backref="product",
        lazy=True,
        cascade="all, delete-orphan"
    )

    created_at = db.Column(db.DateTime, default=lambda: datetime.now(UTC))
    updated_at = db.Column(
        db.DateTime,
        default=lambda: datetime.now(UTC),
        onupdate=lambda: datetime.now(UTC)
    )


class ProductImage(db.Model):
    __tablename__ = "product_images"

    id = db.Column(db.Integer, primary_key=True)

    product_id = db.Column(
        db.Integer,
        db.ForeignKey("products.id"),
        nullable=False
    )

    image_url = db.Column(db.String(500), nullable=False)
    is_main = db.Column(db.Boolean, default=False)

    created_at = db.Column(db.DateTime, default=lambda: datetime.now(UTC))


class SiteSettings(db.Model):
    __tablename__ = "site_settings"

    id = db.Column(db.Integer, primary_key=True)

    business_name = db.Column(db.String(150), default="FootballChannel")
    whatsapp_number = db.Column(db.String(50), nullable=True)
    instagram_url = db.Column(db.String(300), nullable=True)
    location = db.Column(db.String(200), nullable=True)

    about_text = db.Column(db.Text, nullable=True)
    delivery_note = db.Column(db.Text, nullable=True)
    payment_note = db.Column(db.Text, nullable=True)
    hero_text = db.Column(db.Text, nullable=True)

    logo_url = db.Column(db.String(500), nullable=True)
    hero_image_url = db.Column(db.String(500), nullable=True)

    primary_color = db.Column(db.String(20), default="#39D316")
    secondary_color = db.Column(db.String(20), default="#050805")
    theme = db.Column(db.String(50), default="sports")

    created_at = db.Column(db.DateTime, default=lambda: datetime.now(UTC))
    updated_at = db.Column(
        db.DateTime,
        default=lambda: datetime.now(UTC),
        onupdate=lambda: datetime.now(UTC)
    )
