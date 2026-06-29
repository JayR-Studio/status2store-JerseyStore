import os
from dotenv import load_dotenv
from app import app
from models import db, Admin, Category, SiteSettings

load_dotenv()


def slugify(text):
    return (
        text.lower()
        .strip()
        .replace(" ", "-")
        .replace("/", "-")
        .replace("&", "and")
    )


with app.app_context():
    db.create_all()

    admin_email = os.getenv("ADMIN_EMAIL")
    admin_password = os.getenv("ADMIN_PASSWORD")

    if not admin_email or not admin_password:
        raise ValueError("ADMIN_EMAIL and ADMIN_PASSWORD must be set.")

    existing_admin = Admin.query.filter_by(email=admin_email).first()

    if not existing_admin:
        admin = Admin(email=admin_email)
        admin.set_password(admin_password)
        db.session.add(admin)
        print("Admin account created.")
    else:
        print("Admin account already exists.")

    if not SiteSettings.query.first():
        settings = SiteSettings(
            business_name=os.getenv("BUSINESS_NAME", "FootballChannel"),
            whatsapp_number=os.getenv("WHATSAPP_NUMBER", ""),
            instagram_url=os.getenv("INSTAGRAM_URL", ""),
            location=os.getenv("BUSINESS_LOCATION", "Nigeria"),
            about_text="Premium football jerseys, training kits, and fan wear available for quick WhatsApp orders.",
            delivery_note="Nationwide delivery is available. Delivery fee and timeline are confirmed on WhatsApp.",
            payment_note="Payment details are confirmed on WhatsApp.",
            theme=os.getenv("SITE_THEME", "sports")
        )
        db.session.add(settings)
        print("Site settings created.")
    else:
        print("Site settings already exist.")

    starter_categories = [
        "Premier League",
        "La Liga",
        "Serie A",
        "National Teams",
        "Kids Jerseys",
        "Training Kits",
        "Retro Jerseys"
    ]

    for category_name in starter_categories:
        existing_category = Category.query.filter_by(name=category_name).first()

        if not existing_category:
            category = Category(
                name=category_name,
                slug=slugify(category_name)
            )
            db.session.add(category)

    db.session.commit()

    print("Production database setup complete.")
