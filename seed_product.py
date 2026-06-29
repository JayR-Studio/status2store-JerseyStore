from app import app
from models import db, Category, Product


def slugify(text):
    return (
        text.lower()
        .strip()
        .replace(" ", "-")
        .replace("/", "-")
        .replace("&", "and")
    )


sample_products = [
    {
        "name": "Manchester United Home Jersey",
        "description": "Premium Manchester United home jersey for match days, outings, and loyal fans.",
        "price": 20000,
        "category": "Premier League",
        "is_available": True,
        "is_featured": True,
    },
    {
        "name": "Arsenal Away Jersey",
        "description": "Clean Arsenal away jersey with a comfortable fan-ready fit.",
        "price": 20000,
        "category": "Premier League",
        "is_available": True,
        "is_featured": True,
    },
    {
        "name": "Barcelona Home Jersey",
        "description": "Classic Barcelona home jersey for supporters who want a bold club look.",
        "price": 20000,
        "category": "La Liga",
        "is_available": True,
        "is_featured": True,
    },
    {
        "name": "Real Madrid Home Jersey",
        "description": "Premium Real Madrid home jersey with a clean white finish.",
        "price": 20000,
        "category": "La Liga",
        "is_available": False,
        "is_featured": True,
    },
    {
        "name": "Nigeria Home Jersey",
        "description": "Nigeria national team jersey for proud fans and game-day confidence.",
        "price": 18000,
        "category": "National Teams",
        "is_available": True,
        "is_featured": False,
    },
    {
        "name": "Kids Chelsea Jersey",
        "description": "Comfortable Chelsea jersey for young fans.",
        "price": 15000,
        "category": "Kids Jerseys",
        "is_available": True,
        "is_featured": False,
    },
    {
        "name": "AC Milan Home Jersey",
        "description": "AC Milan jersey with a sharp red and black club look.",
        "price": 20000,
        "category": "Serie A",
        "is_available": True,
        "is_featured": False,
    },
    {
        "name": "Club Training Kit",
        "description": "Lightweight training kit suitable for football practice and casual wear.",
        "price": 22000,
        "category": "Training Kits",
        "is_available": True,
        "is_featured": False,
    },
]


with app.app_context():
    for item in sample_products:
        category = Category.query.filter_by(name=item["category"]).first()

        if not category:
            category = Category(
                name=item["category"],
                slug=slugify(item["category"])
            )
            db.session.add(category)
            db.session.commit()

        existing_product = Product.query.filter_by(name=item["name"]).first()

        if existing_product:
            print(f"Skipped: {item['name']} already exists.")
            continue

        product = Product(
            name=item["name"],
            slug=slugify(item["name"]),
            description=item["description"],
            price=item["price"],
            category_id=category.id,
            is_available=item["is_available"],
            is_featured=item["is_featured"],
        )

        db.session.add(product)

    db.session.commit()

    print("Sample products added successfully.")
