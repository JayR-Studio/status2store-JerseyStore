from app import app
from models import db, SiteSettings

with app.app_context():
    settings = SiteSettings.query.first()

    if settings:
        settings.theme = "sports"
        db.session.commit()
        print("Theme changed.")
    else:
        print("No settings found.")