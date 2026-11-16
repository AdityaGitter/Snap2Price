import json
from sqlalchemy.orm import Session
from app.models.user import User
from app.models.product import Category, Product, Coupon
from app.models.review import Review
from app.utils.auth import get_password_hash
from app.ai.recommender import recommender

def seed_database(db: Session):
    # 1. Create Default Admin & Customer Users
    if not db.query(User).filter(User.email == "admin@shopsmart.ai").first():
        admin = User(
            email="admin@shopsmart.ai",
            hashed_password=get_password_hash("Admin@123"),
            full_name="Admin System Director",
            role="admin",
            is_active=True
        )
        db.add(admin)

    if not db.query(User).filter(User.email == "demo@shopsmart.ai").first():
        demo_user = User(
            email="demo@shopsmart.ai",
            hashed_password=get_password_hash("Demo@123"),
            full_name="Demo Shopper",
            role="customer",
            is_active=True
        )
        db.add(demo_user)
    
    db.commit()

    # 2. Create Categories
    categories_data = [
        {
            "name": "Laptops & Computing",
            "slug": "laptops-computing",
            "description": "High-performance ultrabooks, gaming laptops, and computing accessories.",
            "image_url": "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=600&q=80"
        },
        {
            "name": "Smartphones & Audio",
            "slug": "smartphones-audio",
            "description": "Flagship 5G smartphones, wireless earbuds, and studio headphones.",
            "image_url": "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600&q=80"
        },
        {
            "name": "Electronics",
            "slug": "electronics",
            "description": "Smart TVs, 4K cameras, monitors, and modern smart home gadgets.",
            "image_url": "https://images.unsplash.com/photo-1526738549149-8e07eca6c147?w=600&q=80"
        },
        {
            "name": "Fashion & Apparel",
            "slug": "fashion-apparel",
            "description": "Trending urban streetwear, premium jackets, sneakers, and casual fashion.",
            "image_url": "https://images.unsplash.com/photo-1445205170230-053b83016050?w=600&q=80"
        },
        {
            "name": "Home & Kitchen",
            "slug": "home-kitchen",
            "description": "Smart kitchen appliances, espresso makers, air purifiers, and home essentials.",
            "image_url": "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=600&q=80"
        },
        {
            "name": "Fitness & Lifestyle",
            "slug": "fitness-lifestyle",
            "description": "Smart fitness trackers, athletic gym equipment, and wellness essentials.",
            "image_url": "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=600&q=80"
        }
    ]

    cat_map = {}
    for cat in categories_data:
        existing = db.query(Category).filter(Category.slug == cat["slug"]).first()
        if not existing:
            new_cat = Category(**cat)
            db.add(new_cat)
            db.commit()
            db.refresh(new_cat)
            cat_map[cat["name"]] = new_cat.id
        else:
            cat_map[cat["name"]] = existing.id

    # 3. Create 48 Realistic Products
    if db.query(Product).count() < 40:
        products_data = [
            # Laptops & Computing (8)
            {
                "name": "Apple MacBook Air M3 (13.6-inch)",
                "slug": "apple-macbook-air-m3-13",
                "description": "Supercharged by the next-generation M3 chip, delivering extraordinary speed, up to 18 hours of battery life, and a vibrant Liquid Retina display in an ultra-thin unibody chassis.",
                "price": 114900.0,
                "original_price": 124900.0,
                "stock": 25,
                "category_id": cat_map["Laptops & Computing"],
                "brand": "Apple",
                "rating": 4.9,
                "review_count": 142,
                "image_url": "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&q=80",
                "features": "Apple M3 8-core CPU\n10-core GPU\n8GB Unified Memory\n512GB SSD Storage\nMagSafe 3 Charging",
                "specifications": json.dumps({"Processor": "Apple M3", "RAM": "8GB", "Storage": "512GB SSD", "Display": "13.6-inch Liquid Retina", "Weight": "1.24 kg"}),
                "is_featured": True
            },
            {
                "name": "Dell XPS 14 OLED Ultrabook",
                "slug": "dell-xps-14-oled",
                "description": "Crafted with CNC machined aluminum and Gorilla Glass 3, featuring an Intel Core Ultra 7 processor and a breathtaking 3.2K OLED InfinityEdge touch screen.",
                "price": 164990.0,
                "original_price": 179990.0,
                "stock": 15,
                "category_id": cat_map["Laptops & Computing"],
                "brand": "Dell",
                "rating": 4.8,
                "review_count": 89,
                "image_url": "https://images.unsplash.com/photo-1593642632823-8f785ba67e45?w=800&q=80",
                "features": "Intel Core Ultra 7 155H\n16GB LPDDR5X RAM\n1TB NVMe PCIe 4.0 SSD\n14.5-inch 3.2K OLED 120Hz",
                "specifications": json.dumps({"Processor": "Intel Core Ultra 7", "RAM": "16GB", "Storage": "1TB SSD", "Display": "14.5-inch 3.2K OLED", "Graphics": "RTX 4050 6GB"}),
                "is_featured": True
            },
            {
                "name": "Asus ROG Zephyrus G16 Gaming Laptop",
                "slug": "asus-rog-zephyrus-g16",
                "description": "Slim, precision-milled aluminum gaming powerhouse equipped with NVIDIA GeForce RTX 4070, ROG Nebula 2.5K OLED 240Hz display, and intelligent vapor chamber cooling.",
                "price": 189990.0,
                "original_price": 209990.0,
                "stock": 12,
                "category_id": cat_map["Laptops & Computing"],
                "brand": "Asus",
                "rating": 4.9,
                "review_count": 64,
                "image_url": "https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=800&q=80",
                "features": "Intel Core Ultra 9 185H\nRTX 4070 8GB GDDR6\n32GB LPDDR5X RAM\n1TB M.2 PCIe Gen 4 SSD",
                "specifications": json.dumps({"GPU": "NVIDIA RTX 4070", "RAM": "32GB", "Display": "16-inch 240Hz OLED", "Weight": "1.85 kg"}),
                "is_featured": True
            },
            {
                "name": "HP Pavilion 15 Core i5 (College Special)",
                "slug": "hp-pavilion-15-core-i5",
                "description": "The perfect balance of everyday performance, lightweight portability, and full-size keyboard with B&O tuned dual speakers for students and professionals.",
                "price": 48990.0,
                "original_price": 57990.0,
                "stock": 40,
                "category_id": cat_map["Laptops & Computing"],
                "brand": "HP",
                "rating": 4.6,
                "review_count": 230,
                "image_url": "https://images.unsplash.com/photo-1544731612-de7f96afe55f?w=800&q=80",
                "features": "13th Gen Intel Core i5-1335U\n16GB DDR4 RAM\n512GB PCIe NVMe SSD\n15.6-inch Full HD IPS Anti-Glare",
                "specifications": json.dumps({"Processor": "Intel Core i5-1335U", "RAM": "16GB", "Storage": "512GB SSD", "Display": "15.6 FHD IPS", "Battery": "Up to 8.5 Hours"}),
                "is_featured": False
            },
            {
                "name": "Lenovo IdeaPad Slim 3 Ryzen 5",
                "slug": "lenovo-ideapad-slim-3-ryzen-5",
                "description": "Fast AMD Ryzen 5 processor engineered for multitasking, study sessions, and video calls with military-grade durability testing and rapid charge boost.",
                "price": 44990.0,
                "original_price": 52990.0,
                "stock": 35,
                "category_id": cat_map["Laptops & Computing"],
                "brand": "Lenovo",
                "rating": 4.5,
                "review_count": 180,
                "image_url": "https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?w=800&q=80",
                "features": "AMD Ryzen 5 7520U\n16GB LPDDR5 RAM\n512GB SSD\n15.6-inch FHD Eye Care Display",
                "specifications": json.dumps({"Processor": "AMD Ryzen 5 7520U", "RAM": "16GB", "Storage": "512GB SSD", "Weight": "1.62 kg"}),
                "is_featured": False
            },
            {
                "name": "Apple MacBook Pro 16 M3 Max",
                "slug": "apple-macbook-pro-16-m3-max",
                "description": "Unrivaled mobile workstation built for machine learning engineers, 3D artists, and software developers needing extreme compute power and Liquid Retina XDR.",
                "price": 349900.0,
                "original_price": 369900.0,
                "stock": 8,
                "category_id": cat_map["Laptops & Computing"],
                "brand": "Apple",
                "rating": 5.0,
                "review_count": 48,
                "image_url": "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&q=80",
                "features": "Apple M3 Max 16-core CPU\n40-core GPU\n48GB Unified RAM\n1TB Superfast SSD\nLiquid Retina XDR 120Hz",
                "specifications": json.dumps({"Processor": "Apple M3 Max", "RAM": "48GB", "Storage": "1TB SSD", "Battery": "22 Hours"}),
                "is_featured": True
            },
            {
                "name": "Logitech MX Master 3S Wireless Mouse",
                "slug": "logitech-mx-master-3s",
                "description": "Iconic ergonomics with Quiet Click switches, 8000 DPI track-on-glass sensor, and the MagSpeed electromagnetic scroll wheel that scrolls 1,000 lines per second.",
                "price": 8995.0,
                "original_price": 10995.0,
                "stock": 50,
                "category_id": cat_map["Laptops & Computing"],
                "brand": "Logitech",
                "rating": 4.9,
                "review_count": 310,
                "image_url": "https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=800&q=80",
                "features": "8K DPI Any-Surface Tracking\nMagSpeed Electromagnetic Wheel\nFlow Multi-Device Switching\nUSB-C Fast Recharge",
                "specifications": json.dumps({"Connectivity": "Bluetooth / Logi Bolt", "Battery Life": "70 Days", "Weight": "141g"}),
                "is_featured": False
            },
            {
                "name": "Keychron Q1 Pro Wireless Custom Mechanical Keyboard",
                "slug": "keychron-q1-pro-mechanical-keyboard",
                "description": "CNC machined full aluminum body, double-gasket acoustic mount design, hot-swappable tactile switches, and QMK/VIA programmable firmware.",
                "price": 17999.0,
                "original_price": 19999.0,
                "stock": 20,
                "category_id": cat_map["Laptops & Computing"],
                "brand": "Keychron",
                "rating": 4.8,
                "review_count": 75,
                "image_url": "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800&q=80",
                "features": "Full CNC Aluminum Body\nDouble-Gasket Design\nHot-Swappable Switches\nSouth-Facing RGB Backlight",
                "specifications": json.dumps({"Layout": "75%", "Switches": "Keychron K Pro Banana Tactile", "Connectivity": "Bluetooth 5.1 & Type-C"}),
                "is_featured": False
            },

            # Smartphones & Audio (8)
            {
                "name": "Apple iPhone 15 Pro (128GB, Natural Titanium)",
                "slug": "apple-iphone-15-pro-titanium",
                "description": "Forged in aerospace-grade titanium with the breakthrough A17 Pro chip, customizable Action button, and a versatile pro camera system featuring 48MP main sensor.",
                "price": 127990.0,
                "original_price": 134900.0,
                "stock": 30,
                "category_id": cat_map["Smartphones & Audio"],
                "brand": "Apple",
                "rating": 4.9,
                "review_count": 420,
                "image_url": "https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=800&q=80",
                "features": "A17 Pro chip with 6-core GPU\n6.1-inch Super Retina XDR ProMotion\n48MP Pro camera system\nUSB-C with USB 3 speeds",
                "specifications": json.dumps({"Processor": "A17 Pro", "Display": "6.1 Super Retina XDR", "Camera": "48MP + 12MP + 12MP", "Weight": "187g"}),
                "is_featured": True
            },
            {
                "name": "Samsung Galaxy S24 Ultra 5G (Titanium Gray)",
                "slug": "samsung-galaxy-s24-ultra-5g",
                "description": "The pinnacle of Android engineering featuring Galaxy AI, Snapdragon 8 Gen 3, built-in S-Pen, and a revolutionary 200MP Quad Telephoto camera with 100x Space Zoom.",
                "price": 129999.0,
                "original_price": 139999.0,
                "stock": 22,
                "category_id": cat_map["Smartphones & Audio"],
                "brand": "Samsung",
                "rating": 4.8,
                "review_count": 315,
                "image_url": "https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=800&q=80",
                "features": "Galaxy AI Live Translate & Circle to Search\n200MP Camera with 5x Optical Zoom\nBuilt-in S Pen stylus\n5000 mAh All-Day Battery",
                "specifications": json.dumps({"Chipset": "Snapdragon 8 Gen 3", "Display": "6.8 QHD+ Dynamic AMOLED 2X", "RAM": "12GB", "Battery": "5000mAh"}),
                "is_featured": True
            },
            {
                "name": "OnePlus 12 5G (Flowy Emerald)",
                "slug": "oneplus-12-5g-emerald",
                "description": "Elite performance fueled by Snapdragon 8 Gen 3, 4th Gen Hasselblad Camera System, 5400mAh battery, and 100W SUPERVOOC charging that hits 100% in 26 minutes.",
                "price": 64999.0,
                "original_price": 69999.0,
                "stock": 28,
                "category_id": cat_map["Smartphones & Audio"],
                "brand": "OnePlus",
                "rating": 4.7,
                "review_count": 185,
                "image_url": "https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=800&q=80",
                "features": "Snapdragon 8 Gen 3\n50MP Sony LYT-808 Camera\n100W Wired & 50W Wireless Charging\n2K 120Hz ProXDR Display",
                "specifications": json.dumps({"RAM": "16GB", "Storage": "512GB", "Display": "6.82 2K 120Hz", "Charging": "100W"}),
                "is_featured": False
            },
            {
                "name": "Sony WH-1000XM5 Wireless Noise Cancelling Headphones",
                "slug": "sony-wh-1000xm5-headphones",
                "description": "Two processors and 8 microphones deliver flagship noise cancellation, crystal clear hands-free calling, and LDAC high-resolution wireless audio.",
                "price": 28990.0,
                "original_price": 34990.0,
                "stock": 35,
                "category_id": cat_map["Smartphones & Audio"],
                "brand": "Sony",
                "rating": 4.9,
                "review_count": 520,
                "image_url": "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80",
                "features": "Industry-leading Active Noise Cancellation\n30-hour battery life with quick charge\nMulti-point Bluetooth connectivity\nAuto NC Optimizer",
                "specifications": json.dumps({"Driver": "30mm Carbon Fiber", "Battery": "30 Hours", "Weight": "250g", "Codecs": "LDAC, AAC, SBC"}),
                "is_featured": True
            },
            {
                "name": "Apple AirPods Pro (2nd Generation with USB-C)",
                "slug": "apple-airpods-pro-2-usbc",
                "description": "Powered by Apple H2 chip for up to 2x more Active Noise Cancellation, Adaptive Audio that blends transparency and ANC, and Personalized Spatial Audio.",
                "price": 23900.0,
                "original_price": 24900.0,
                "stock": 45,
                "category_id": cat_map["Smartphones & Audio"],
                "brand": "Apple",
                "rating": 4.9,
                "review_count": 610,
                "image_url": "https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=800&q=80",
                "features": "Active Noise Cancellation & Transparency Mode\nAdaptive Audio & Conversation Awareness\nMagSafe Case with USB-C and Speaker\nPrecision Finding with U1 chip",
                "specifications": json.dumps({"Chip": "Apple H2", "Battery Life": "6 hrs earbud / 30 hrs with case", "Water Resistance": "IP54"}),
                "is_featured": True
            },
            {
                "name": "Bose QuietComfort Ultra Wireless Earbuds",
                "slug": "bose-quietcomfort-ultra-earbuds",
                "description": "World-class active noise cancellation with breakthrough Bose Immersive Audio that takes what you're hearing out of your head and places it in front of you.",
                "price": 25900.0,
                "original_price": 29900.0,
                "stock": 18,
                "category_id": cat_map["Smartphones & Audio"],
                "brand": "Bose",
                "rating": 4.8,
                "review_count": 140,
                "image_url": "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=800&q=80",
                "features": "Spatial Immersive Audio\nCustomTune sound personalization\nWorld-class Noise Cancellation\nUp to 24 hours total playtime",
                "specifications": json.dumps({"Battery": "6 hours + 18 via case", "Microphones": "9 total", "Water Resistance": "IPX4"}),
                "is_featured": False
            },
            {
                "name": "Marshall Stanmore III Bluetooth Speaker",
                "slug": "marshall-stanmore-iii-speaker",
                "description": "Re-engineered for a more immersive home audio experience, delivering wider soundstage, iconic vintage rock design, and Bluetooth 5.2 connectivity.",
                "price": 31999.0,
                "original_price": 36999.0,
                "stock": 14,
                "category_id": cat_map["Smartphones & Audio"],
                "brand": "Marshall",
                "rating": 4.9,
                "review_count": 95,
                "image_url": "https://images.unsplash.com/photo-1545454675-3531b543be5d?w=800&q=80",
                "features": "Wider Soundstage with angled tweeters\nNext-gen Bluetooth 5.2 & 3.5mm Aux\nIconic Marshall script logo & brass controls\nDynamic Loudness balance",
                "specifications": json.dumps({"Power Amplifiers": "50W Class D Woofer + 2x15W Tweeters", "Frequency": "45–20,000 Hz", "Weight": "4.25 kg"}),
                "is_featured": False
            },
            {
                "name": "boAt Airdopes 141 ANC Wireless Earbuds",
                "slug": "boat-airdopes-141-anc",
                "description": "Budget champion with 32dB active noise cancellation, beast mode for ultra-low latency gaming, and ENx technology for crystal-clear voice calls.",
                "price": 1499.0,
                "original_price": 4490.0,
                "stock": 80,
                "category_id": cat_map["Smartphones & Audio"],
                "brand": "boAt",
                "rating": 4.3,
                "review_count": 840,
                "image_url": "https://images.unsplash.com/photo-1572569511254-d8f925fe2cbb?w=800&q=80",
                "features": "32 dB Active Noise Cancellation\n42 Hours Total Playback\nBeast Mode 50ms Low Latency\nASAP Charge (10 mins = 150 mins)",
                "specifications": json.dumps({"Drivers": "10mm Titanium", "Playtime": "42 Hours", "Bluetooth": "v5.3", "IP Rating": "IPX5"}),
                "is_featured": False
            },

            # Electronics (8)
            {
                "name": "Sony Bravia 55-inch 4K Ultra HD Smart OLED TV",
                "slug": "sony-bravia-55-oled-tv",
                "description": "Cognitive Processor XR delivers pure OLED blacks and billion accurate colors, with Acoustic Surface Audio+ that turns the entire screen into a speaker.",
                "price": 139990.0,
                "original_price": 159990.0,
                "stock": 10,
                "category_id": cat_map["Electronics"],
                "brand": "Sony",
                "rating": 4.9,
                "review_count": 110,
                "image_url": "https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=800&q=80",
                "features": "Cognitive Processor XR\nPure OLED Black & Dynamic Contrast\nAcoustic Surface Audio+\nGoogle TV with Voice Search & HDMI 2.1 120Hz",
                "specifications": json.dumps({"Screen Size": "55-inch", "Resolution": "4K Ultra HD (3840 x 2160)", "Refresh Rate": "120Hz", "Ports": "4 HDMI, 2 USB"}),
                "is_featured": True
            },
            {
                "name": "Fujifilm X-T5 Mirrorless Digital Camera (Body)",
                "slug": "fujifilm-x-t5-camera",
                "description": "Class-leading 40.2MP X-Trans CMOS 5 HR sensor in a compact, lightweight body with 5-axis in-body image stabilization and timeless analog dials.",
                "price": 149999.0,
                "original_price": 164999.0,
                "stock": 7,
                "category_id": cat_map["Electronics"],
                "brand": "Fujifilm",
                "rating": 4.9,
                "review_count": 68,
                "image_url": "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800&q=80",
                "features": "40.2MP Back-Illuminated X-Trans Sensor\n7-Stop 5-Axis In-Body Image Stabilization\n6.2K/30p and 4K/60p Movie Recording\n19 Legendary Film Simulation Modes",
                "specifications": json.dumps({"Sensor": "APS-C X-Trans CMOS 5 HR", "Max Resolution": "7728 x 5152", "Viewfinder": "3.69M-dot OLED", "Weight": "557g"}),
                "is_featured": True
            },
            {
                "name": "Samsung 34-inch Odyssey OLED G8 Curved Gaming Monitor",
                "slug": "samsung-odyssey-oled-g8",
                "description": "Mesmerizing 175Hz refresh rate and 0.03ms response time on a Neo Quantum Processor powered 1800R curved ultra-wide gaming panel.",
                "price": 94990.0,
                "original_price": 109990.0,
                "stock": 12,
                "category_id": cat_map["Electronics"],
                "brand": "Samsung",
                "rating": 4.8,
                "review_count": 55,
                "image_url": "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=800&q=80",
                "features": "34-inch WQHD (3440 x 1440) OLED\n175Hz Refresh Rate & 0.03ms Response\n1800R Curvature with CoreSync Lighting\nSmart TV Apps Built-In",
                "specifications": json.dumps({"Aspect Ratio": "21:9", "Brightness": "250 nits", "HDR": "VESA DisplayHDR True Black 400"}),
                "is_featured": False
            },
            {
                "name": "Anker 737 Power Bank (PowerCore 24K, 140W)",
                "slug": "anker-737-power-bank-140w",
                "description": "Ultra-powerful 140W two-way fast charging capable of fast charging a MacBook Pro 16 to 50% in 40 minutes, equipped with a smart digital display.",
                "price": 13999.0,
                "original_price": 16999.0,
                "stock": 40,
                "category_id": cat_map["Electronics"],
                "brand": "Anker",
                "rating": 4.9,
                "review_count": 210,
                "image_url": "https://images.unsplash.com/photo-1609592424109-dd9892f1b177?w=800&q=80",
                "features": "140W Ultra-Fast Two-Way Charging\nSmart Digital Display showing output & recharge time\n24,000mAh Capacity\nGaNPrime Advanced Heat Control",
                "specifications": json.dumps({"Capacity": "24,000mAh", "Ports": "2 USB-C, 1 USB-A", "Max Output": "140W"}),
                "is_featured": False
            },
            {
                "name": "DJI Mini 4 Pro 4K Drone with Fly More Combo",
                "slug": "dji-mini-4-pro-drone",
                "description": "Under 249g ultra-lightweight drone with omnidirectional obstacle sensing, 4K/60fps HDR True Vertical Shooting, and up to 34 minutes flight time.",
                "price": 104990.0,
                "original_price": 119990.0,
                "stock": 9,
                "category_id": cat_map["Electronics"],
                "brand": "DJI",
                "rating": 4.9,
                "review_count": 82,
                "image_url": "https://images.unsplash.com/photo-1527977966376-1c8408f9f108?w=800&q=80",
                "features": "Under 249g Regulation Friendly\nOmnidirectional Active Obstacle Sensing\n4K/60fps HDR & 4K/100fps Slow Motion\n20 km FHD Video Transmission",
                "specifications": json.dumps({"Max Flight Time": "34 mins", "Sensor": "1/1.3-inch CMOS", "Video": "4K/60fps HDR", "Weight": "249g"}),
                "is_featured": True
            },
            {
                "name": "Apple iPad Air M2 (11-inch, 128GB Wi-Fi)",
                "slug": "apple-ipad-air-m2-11",
                "description": "Supercharged by Apple M2 chip with Liquid Retina display, landscape 12MP front camera with Center Stage, and compatibility with Apple Pencil Pro.",
                "price": 59900.0,
                "original_price": 64900.0,
                "stock": 30,
                "category_id": cat_map["Electronics"],
                "brand": "Apple",
                "rating": 4.8,
                "review_count": 190,
                "image_url": "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=800&q=80",
                "features": "Apple M2 Chip with 8-core CPU\n11-inch Liquid Retina with True Tone\nSupports Apple Pencil Pro and Magic Keyboard\nLandscape Front Camera with Center Stage",
                "specifications": json.dumps({"Processor": "Apple M2", "Storage": "128GB", "Display": "11-inch Liquid Retina", "Weight": "462g"}),
                "is_featured": False
            },
            {
                "name": "Kindle Paperwhite (16GB, 6.8-inch display)",
                "slug": "kindle-paperwhite-16gb",
                "description": "Now with a 6.8 display and thinner borders, adjustable warm light, up to 10 weeks of battery life, and 20% faster page turns.",
                "price": 14999.0,
                "original_price": 16999.0,
                "stock": 35,
                "category_id": cat_map["Electronics"],
                "brand": "Amazon",
                "rating": 4.8,
                "review_count": 480,
                "image_url": "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=800&q=80",
                "features": "6.8-inch Glare-Free 300 ppi E-ink Display\nAdjustable Warm Light\nIPX8 Waterproof Protection\nBattery Life up to 10 Weeks",
                "specifications": json.dumps({"Display": "6.8 Paperwhite 300ppi", "Storage": "16GB", "Battery": "10 Weeks", "Weight": "205g"}),
                "is_featured": False
            },
            {
                "name": "Ring Video Doorbell Pro 2",
                "slug": "ring-video-doorbell-pro-2",
                "description": "Premium wired video doorbell with 1536p HD Head-to-Toe video, 3D Motion Detection with Bird's Eye View, and two-way talk with Audio+.",
                "price": 19999.0,
                "original_price": 24999.0,
                "stock": 20,
                "category_id": cat_map["Electronics"],
                "brand": "Ring",
                "rating": 4.6,
                "review_count": 78,
                "image_url": "https://images.unsplash.com/photo-1558002038-1055907df827?w=800&q=80",
                "features": "1536p HD Head-to-Toe Video\n3D Motion Detection & Bird's Eye View\nTwo-Way Talk with Audio+\nDual-Band 2.4 & 5.0 GHz Connectivity",
                "specifications": json.dumps({"Video": "1536p HD HDR", "Field of View": "150 Horizontal, 150 Vertical", "Power": "Hardwired"}),
                "is_featured": False
            },

            # Fashion & Apparel (8)
            {
                "name": "Nike Air Jordan 1 Retro High OG",
                "slug": "nike-air-jordan-1-retro-high",
                "description": "The sneaker that started it all. Featuring premium full-grain leather, encapsulated Air-Sole cushioning in the heel, and the iconic Wings logo.",
                "price": 16995.0,
                "original_price": 18995.0,
                "stock": 18,
                "category_id": cat_map["Fashion & Apparel"],
                "brand": "Nike",
                "rating": 4.9,
                "review_count": 340,
                "image_url": "https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?w=800&q=80",
                "features": "Full-Grain Leather Upper\nEncapsulated Nike Air Cushioning\nSolid Rubber Outsole with Deep Flex Grooves\nIconic OG Silhouette",
                "specifications": json.dumps({"Upper": "Genuine Leather", "Sole": "Durable Rubber", "Fit": "True to size", "Closure": "Lace-up"}),
                "is_featured": True
            },
            {
                "name": "Levi's Men's 511 Slim Fit Selvedge Jeans",
                "slug": "levis-511-slim-fit-selvedge-jeans",
                "description": "A modern slim with room to move. Woven on traditional shuttle looms from premium selvedge denim, finished with signature red tab detailing.",
                "price": 5499.0,
                "original_price": 6999.0,
                "stock": 40,
                "category_id": cat_map["Fashion & Apparel"],
                "brand": "Levi's",
                "rating": 4.7,
                "review_count": 210,
                "image_url": "https://images.unsplash.com/photo-1542272604-780c96856592?w=800&q=80",
                "features": "Premium Selvedge Denim\n99% Cotton, 1% Elastane Stretch\nSlim from hip to ankle\nSignature 5-pocket styling",
                "specifications": json.dumps({"Material": "99% Cotton, 1% Elastane", "Fit": "Slim", "Rise": "Mid-rise", "Wash": "Raw Dark Indigo"}),
                "is_featured": False
            },
            {
                "name": "The North Face Nuptse 1996 Retro Down Jacket",
                "slug": "north-face-nuptse-1996-down-jacket",
                "description": "Built for mountain and city life with 700-fill goose down insulation, durable water-repellent (DWR) finish, and stowable hood.",
                "price": 27999.0,
                "original_price": 31999.0,
                "stock": 15,
                "category_id": cat_map["Fashion & Apparel"],
                "brand": "The North Face",
                "rating": 4.9,
                "review_count": 160,
                "image_url": "https://images.unsplash.com/photo-1548883354-7622d03aca27?w=800&q=80",
                "features": "700-Fill Responsible Down Standard (RDS) Goose Down\nOriginal Shiny Ripstop Fabric with DWR\nStowable Hood Packs into Collar\nInternal Secure-Zip Chest Pocket",
                "specifications": json.dumps({"Insulation": "700 Fill Down", "Shell": "100% Recycled Nylon", "Fit": "Boxy Retro Fit"}),
                "is_featured": True
            },
            {
                "name": "Zara Minimalist Tailored Wool Blend Blazer",
                "slug": "zara-tailored-wool-blend-blazer",
                "description": "Contemporary structured blazer crafted from structured Italian wool-blend weave with peaked lapels, flap front pockets, and contrast horn buttons.",
                "price": 7990.0,
                "original_price": 9990.0,
                "stock": 25,
                "category_id": cat_map["Fashion & Apparel"],
                "brand": "Zara",
                "rating": 4.6,
                "review_count": 88,
                "image_url": "https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=800&q=80",
                "features": "Tailored Notch Lapels\nStructured Shoulder Silhouette\nViscose Interior Lining\nChest Welt Pocket",
                "specifications": json.dumps({"Fabric": "60% Wool, 38% Polyester, 2% Elastane", "Lining": "100% Viscose", "Care": "Dry Clean Only"}),
                "is_featured": False
            },
            {
                "name": "Adidas Ultraboost Light Running Shoes",
                "slug": "adidas-ultraboost-light-shoes",
                "description": "Experience epic energy in the lightest Ultraboost ever made. Featuring revolutionary Light BOOST midsole cushioning and Primeknit+ forged textile upper.",
                "price": 14999.0,
                "original_price": 18999.0,
                "stock": 32,
                "category_id": cat_map["Fashion & Apparel"],
                "brand": "Adidas",
                "rating": 4.8,
                "review_count": 290,
                "image_url": "https://images.unsplash.com/photo-1587563871167-1ee9c731aefb?w=800&q=80",
                "features": "30% Lighter BOOST Material\nLinear Energy Push (LEP) System\nContinental Better Rubber Outsole\nPrimeknit+ Adaptive Foot Hugging Upper",
                "specifications": json.dumps({"Drop": "10mm", "Weight": "299g (Size 9)", "Arch Type": "Normal"}),
                "is_featured": False
            },
            {
                "name": "Ray-Ban Aviator Classic Polarized Sunglasses",
                "slug": "ray-ban-aviator-classic-polarized",
                "description": "Originally designed for U.S. aviators in 1937, featuring gold metal frames and crystal green G-15 polarized lenses that absorb 85% of visible light.",
                "price": 12890.0,
                "original_price": 14490.0,
                "stock": 28,
                "category_id": cat_map["Fashion & Apparel"],
                "brand": "Ray-Ban",
                "rating": 4.9,
                "review_count": 380,
                "image_url": "https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=800&q=80",
                "features": "Polarized G-15 Crystal Lenses\n100% UV400 Protection\nClassic Teardrop Aviation Silhouette\nAdjustable Silicone Nose Pads",
                "specifications": json.dumps({"Frame": "Polished Gold Metal", "Lens": "Polarized Green G-15", "Size": "58mm Standard"}),
                "is_featured": False
            },
            {
                "name": "Puma Classic Suede Low-Top Sneakers",
                "slug": "puma-classic-suede-sneakers",
                "description": "A cultural titan since 1968, worn by legends and street icons across generations, crafted in plush full suede with synthetic lining.",
                "price": 4299.0,
                "original_price": 6999.0,
                "stock": 50,
                "category_id": cat_map["Fashion & Apparel"],
                "brand": "Puma",
                "rating": 4.6,
                "review_count": 175,
                "image_url": "https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=800&q=80",
                "features": "Full Soft Suede Upper\nPuma Formstrip along lateral sides\nCushioned Comfort Midsole\nNon-Marking Grippy Rubber Outsole",
                "specifications": json.dumps({"Material": "100% Suede Leather", "Closure": "Lace-up", "Sole": "Rubber"}),
                "is_featured": False
            },
            {
                "name": "H&M Heavyweight Relaxed Fit Cotton Hoodie",
                "slug": "hm-heavyweight-relaxed-fit-hoodie",
                "description": "Comfort perfected in 460gsm organic brushed cotton fleece with a double-layered hood, kangaroo pocket, and wide ribbed hem.",
                "price": 2299.0,
                "original_price": 2999.0,
                "stock": 60,
                "category_id": cat_map["Fashion & Apparel"],
                "brand": "H&M",
                "rating": 4.5,
                "review_count": 220,
                "image_url": "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=800&q=80",
                "features": "460 GSM Heavyweight Cotton Fleece\nRelaxed Dropped Shoulder Cut\nDouble-Layered Structured Hood\nSoft Brushed Interior",
                "specifications": json.dumps({"Material": "100% Organic Cotton", "Fit": "Relaxed", "Weight": "460 GSM"}),
                "is_featured": False
            },

            # Home & Kitchen (8)
            {
                "name": "Dyson V15 Detect Absolute Cordless Vacuum",
                "slug": "dyson-v15-detect-vacuum",
                "description": "Illuminates invisible microscopic dust with precisely-angled laser beam, counts dust particles on an LCD screen, and automatically adjusts suction power.",
                "price": 62900.0,
                "original_price": 69900.0,
                "stock": 14,
                "category_id": cat_map["Home & Kitchen"],
                "brand": "Dyson",
                "rating": 4.9,
                "review_count": 130,
                "image_url": "https://images.unsplash.com/photo-1558317374-067fb5f30001?w=800&q=80",
                "features": "Laser Dust Detection Technology\nPiezo Sensor Counts & Sizes Particles\n240 AW Powerful Cyclone Suction\nUp to 60 Minutes Run Time",
                "specifications": json.dumps({"Suction Power": "240 AW", "Bin Volume": "0.76 L", "Run Time": "60 mins", "Weight": "3.0 kg"}),
                "is_featured": True
            },
            {
                "name": "De'Longhi Magnifica S Automatic Espresso Machine",
                "slug": "delonghi-magnifica-s-espresso",
                "description": "Bean-to-cup authentic Italian coffee at the touch of a button with integrated silent burr grinder, 15-bar pressure pump, and manual milk frother.",
                "price": 42999.0,
                "original_price": 49999.0,
                "stock": 11,
                "category_id": cat_map["Home & Kitchen"],
                "brand": "De'Longhi",
                "rating": 4.8,
                "review_count": 92,
                "image_url": "https://images.unsplash.com/photo-1517668808822-9ebb02ae2a0e?w=800&q=80",
                "features": "Integrated Steel Burr Grinder with 13 Settings\n15-Bar Professional Italian Pump\nTraditional Cappuccino System Steam Wand\nEasy Removable Brewing Unit",
                "specifications": json.dumps({"Pump Pressure": "15 bar", "Water Tank": "1.8 L", "Beans Container": "250g", "Power": "1450W"}),
                "is_featured": True
            },
            {
                "name": "Philips Digital Air Fryer HD9252 with Rapid Air",
                "slug": "philips-digital-air-fryer-hd9252",
                "description": "Healthy frying with Rapid Air technology for delicious food with up to 90% less fat. Features 7 touch screen presets and Keep Warm mode.",
                "price": 7999.0,
                "original_price": 11999.0,
                "stock": 35,
                "category_id": cat_map["Home & Kitchen"],
                "brand": "Philips",
                "rating": 4.7,
                "review_count": 410,
                "image_url": "https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?w=800&q=80",
                "features": "Rapid Air Starfish Pan Design\nTouch Screen with 7 Cooking Presets\n4.1L Capacity (0.8kg basket)\nDishwasher-Safe Removable Parts",
                "specifications": json.dumps({"Capacity": "4.1 Litres", "Power": "1400 Watts", "Temperature Range": "80°C - 200°C"}),
                "is_featured": False
            },
            {
                "name": "Instant Pot Duo 7-in-1 Electric Pressure Cooker (6 Qt)",
                "slug": "instant-pot-duo-7-in-1-pressure-cooker",
                "description": "Combines 7 kitchen appliances in 1: Pressure cooker, slow cooker, rice cooker, steamer, sauté pan, yogurt maker, and food warmer.",
                "price": 8990.0,
                "original_price": 12990.0,
                "stock": 25,
                "category_id": cat_map["Home & Kitchen"],
                "brand": "Instant Pot",
                "rating": 4.8,
                "review_count": 350,
                "image_url": "https://images.unsplash.com/photo-1544233726-9f1d2b27be8b?w=800&q=80",
                "features": "7-in-1 Multi-Use Programmable Cooker\n13 One-Touch Smart Programs\nFood-Grade 304 Stainless Steel Pot\n10+ Proven Safety Mechanisms",
                "specifications": json.dumps({"Capacity": "5.7 Litres (6 Qt)", "Power": "1000W", "Weight": "5.4 kg"}),
                "is_featured": False
            },
            {
                "name": "Ninja Professional Plus Blender with Auto-iQ",
                "slug": "ninja-professional-plus-blender",
                "description": "Crush ice to snow in seconds with 1400-peak-watt motor and Total Crushing blades for smoothies, frozen drinks, and nutrient extractions.",
                "price": 11999.0,
                "original_price": 14999.0,
                "stock": 20,
                "category_id": cat_map["Home & Kitchen"],
                "brand": "Ninja",
                "rating": 4.8,
                "review_count": 195,
                "image_url": "https://images.unsplash.com/photo-1570222094114-d054a817e56b?w=800&q=80",
                "features": "1400 Peak Watts Motor Base\n72 oz Total Crushing Pitcher\n3 Preset Auto-iQ Programs\nBPA-Free & Dishwasher Safe Parts",
                "specifications": json.dumps({"Motor Power": "1400 Peak Watts", "Pitcher Capacity": "72 oz (2.1 L)", "Speeds": "3 + Pulse"}),
                "is_featured": False
            },
            {
                "name": "Coway Airmega 150 True HEPA Air Purifier",
                "slug": "coway-airmega-150-air-purifier",
                "description": "Special Green True HEPA filter traps 99.99% of airborne particles as small as 0.01 microns, with intuitive real-time air quality light ring indicator.",
                "price": 12990.0,
                "original_price": 17990.0,
                "stock": 28,
                "category_id": cat_map["Home & Kitchen"],
                "brand": "Coway",
                "rating": 4.8,
                "review_count": 280,
                "image_url": "https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=800&q=80",
                "features": "Green True HEPA Anti-Virus Filter\nReal-time AQI Air Quality Sensor\nCovers up to 355 sq. ft.\nUltra Quiet Sleep Mode (22 dB)",
                "specifications": json.dumps({"Coverage": "355 sq. ft.", "CADR": "303 m3/h", "Power": "38 Watts", "Noise": "22 - 48 dB"}),
                "is_featured": False
            },
            {
                "name": "Le Creuset Enameled Cast Iron Signature Round Dutch Oven (4.5 Qt)",
                "slug": "le-creuset-cast-iron-dutch-oven",
                "description": "An indispensable French culinary icon that delivers exceptional heat distribution and moisture retention for slow cooking, braising, and baking artisan bread.",
                "price": 28500.0,
                "original_price": 32000.0,
                "stock": 8,
                "category_id": cat_map["Home & Kitchen"],
                "brand": "Le Creuset",
                "rating": 5.0,
                "review_count": 105,
                "image_url": "https://images.unsplash.com/photo-1584990347449-399c58550186?w=800&q=80",
                "features": "Enameled Cast Iron Superior Heat Retention\nNo Seasoning Required\nOven Safe up to 260°C (500°F)\nErgonomic Handles & Stainless Steel Knob",
                "specifications": json.dumps({"Capacity": "4.2 Litres (4.5 Qt)", "Origin": "Made in France", "Heat Source": "Induction, Gas, Electric, Oven"}),
                "is_featured": False
            },
            {
                "name": "Ecovacs Deebot T20 Omni Robot Vacuum & Mop",
                "slug": "ecovacs-deebot-t20-omni",
                "description": "Revolutionary all-in-one robotic cleaner with hot water mop washing, auto-dust emptying, 6000Pa suction power, and automatic 9mm mop lifting on carpets.",
                "price": 69900.0,
                "original_price": 89900.0,
                "stock": 6,
                "category_id": cat_map["Home & Kitchen"],
                "brand": "Ecovacs",
                "rating": 4.7,
                "review_count": 65,
                "image_url": "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=800&q=80",
                "features": "Hot Water Mop Washing & Hot Air Drying\n6000Pa Extreme Cyclone Suction\nAuto-Lift Mopping on Carpets\nTrueDetect 3D 3.0 Obstacle Avoidance",
                "specifications": json.dumps({"Suction": "6000 Pa", "Battery": "5200 mAh", "Dust Bag": "3 Litres", "App": "Ecovacs Home"}),
                "is_featured": False
            },

            # Fitness & Lifestyle (8)
            {
                "name": "Apple Watch Series 9 GPS (45mm Midnight Aluminum)",
                "slug": "apple-watch-series-9-45mm",
                "description": "Powered by S9 SiP with revolutionary Double Tap gesture, 2000 nit bright Always-On display, ECG, Blood Oxygen sensor, and precision Crash Detection.",
                "price": 44900.0,
                "original_price": 48900.0,
                "stock": 25,
                "category_id": cat_map["Fitness & Lifestyle"],
                "brand": "Apple",
                "rating": 4.9,
                "review_count": 310,
                "image_url": "https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=800&q=80",
                "features": "S9 SiP with Magic Double Tap Gesture\nUp to 2000 nits Always-On Retina Display\nECG & Blood Oxygen Monitoring\n50m Water Resistance (Swimproof)",
                "specifications": json.dumps({"Case Size": "45mm", "Display": "OLED Retina LTPO", "Battery": "18 hours / 36 hrs Low Power", "Sensors": "ECG, SpO2, Temperature"}),
                "is_featured": True
            },
            {
                "name": "Garmin Fenix 7 Pro Solar Multisport GPS Watch",
                "slug": "garmin-fenix-7-pro-solar",
                "description": "Solar powered rugged endurance GPS watch with built-in LED flashlight, Hill Score, Endurance Score, and weeks of battery life under the sun.",
                "price": 81990.0,
                "original_price": 89990.0,
                "stock": 9,
                "category_id": cat_map["Fitness & Lifestyle"],
                "brand": "Garmin",
                "rating": 4.9,
                "review_count": 85,
                "image_url": "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80",
                "features": "Power Glass Solar Charging Lens\nUp to 22 Days Battery in Smartwatch Mode\nBuilt-in Multi-LED Flashlight\nMulti-Band GPS with SatIQ Technology",
                "specifications": json.dumps({"Battery": "Up to 22 Days", "Water Rating": "10 ATM", "Display": "1.3 Sunlight-Visible Memory-in-Pixel"}),
                "is_featured": True
            },
            {
                "name": "Samsung Galaxy Watch 6 Classic (47mm Bluetooth)",
                "slug": "samsung-galaxy-watch-6-classic",
                "description": "Timeless rotating physical bezel returns with personalized sleep coaching, heart rhythm notifications, body composition analysis (BIA), and sapphire crystal glass.",
                "price": 32999.0,
                "original_price": 36999.0,
                "stock": 16,
                "category_id": cat_map["Fitness & Lifestyle"],
                "brand": "Samsung",
                "rating": 4.7,
                "review_count": 140,
                "image_url": "https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=800&q=80",
                "features": "Iconic Slim Rotating Bezel\nBIA Sensor for Body Fat & Skeletal Muscle\nPersonalized Sleep Analysis & Coaching\nWear OS Powered by Samsung",
                "specifications": json.dumps({"Display": "1.5 Super AMOLED Sapphire Crystal", "Processor": "Exynos W930", "RAM": "2GB", "Battery": "425 mAh"}),
                "is_featured": False
            },
            {
                "name": "Bowflex SelectTech 552 Adjustable Dumbbells (Pair)",
                "slug": "bowflex-selecttech-552-dumbbells",
                "description": "Replaces 15 sets of weights in one compact pair. Turn the selection dial to adjust resistance from 2.5 kg up to 24 kg per dumbbell.",
                "price": 34990.0,
                "original_price": 39990.0,
                "stock": 12,
                "category_id": cat_map["Fitness & Lifestyle"],
                "brand": "Bowflex",
                "rating": 4.9,
                "review_count": 165,
                "image_url": "https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?w=800&q=80",
                "features": "Adjusts from 2.5 kg to 24 kg per dumbbell\nRapid Dial Turn Resistance Selection\nHeavy-Duty Molding for Quiet Lift\nSpace-Saving All-in-One Home Gym Design",
                "specifications": json.dumps({"Weight Range": "2.5 to 24 kg (5 to 52.5 lbs)", "Number of Weight Settings": "15", "Material": "Steel, Nylon, ABS"}),
                "is_featured": False
            },
            {
                "name": "Manduka PRO Yoga and Pilates Mat (6mm)",
                "slug": "manduka-pro-yoga-mat-6mm",
                "description": "The world's premier dense cushioning yoga mat trusted by teachers worldwide for joint protection, grip surface, and lifetime longevity guarantee.",
                "price": 10999.0,
                "original_price": 12999.0,
                "stock": 30,
                "category_id": cat_map["Fitness & Lifestyle"],
                "brand": "Manduka",
                "rating": 4.9,
                "review_count": 210,
                "image_url": "https://images.unsplash.com/photo-1545205597-3d9d02c29597?w=800&q=80",
                "features": "Ultra-Dense 6mm Cushioning for Joint Protection\nClosed-Cell Surface Keeps Out Sweat & Moisture\nNon-Toxic OEKO-TEX Certified Manufacturing\nProprietary Dot Pattern Bottom Grips Floor",
                "specifications": json.dumps({"Thickness": "6 mm", "Length": "180 cm", "Width": "66 cm", "Weight": "3.4 kg"}),
                "is_featured": False
            },
            {
                "name": "Theragun PRO Gen 5 Percussive Therapy Massager",
                "slug": "theragun-pro-gen-5-massager",
                "description": "Professional-grade deep muscle treatment trusted by athletic trainers, featuring patented triangular ergonomic multi-grip, OLED screen, and ultra-quiet motor.",
                "price": 49999.0,
                "original_price": 54999.0,
                "stock": 10,
                "category_id": cat_map["Fitness & Lifestyle"],
                "brand": "Theragun",
                "rating": 4.8,
                "review_count": 78,
                "image_url": "https://images.unsplash.com/photo-1518611012118-696072aa579a?w=800&q=80",
                "features": "16mm Amplitude Reaches 60% Deeper into Muscle\nPatented Ergonomic Multi-Grip Handle\nOLED Screen with Built-In Guided Visual Routines\nUp to 60 lbs of Stall Force Resistance",
                "specifications": json.dumps({"Speed Range": "1750-2400 PPM", "Amplitude": "16mm", "Battery": "150 mins per charge", "Weight": "1.25 kg"}),
                "is_featured": False
            },
            {
                "name": "Lululemon The Workout Mat 6mm Non-Slip",
                "slug": "lululemon-workout-mat-6mm",
                "description": "Reversible workout mat designed for intense sweaty HIIT and yoga sessions with a natural rubber base and polyurethane top layer that absorbs sweat for superior grip.",
                "price": 6800.0,
                "original_price": 7500.0,
                "stock": 25,
                "category_id": cat_map["Fitness & Lifestyle"],
                "brand": "Lululemon",
                "rating": 4.7,
                "review_count": 135,
                "image_url": "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800&q=80",
                "features": "Sweat-Wicking Grippy Polyurethane Top\nCushioning Natural Rubber Base\nAntimicrobial Additive to Inhibit Mildew\nReversible Textured Design",
                "specifications": json.dumps({"Dimensions": "66cm x 180cm", "Thickness": "6mm", "Material": "Natural Rubber & Polyurethane"}),
                "is_featured": False
            },
            {
                "name": "Hydro Flask 32 oz Wide Mouth Stainless Steel Bottle",
                "slug": "hydro-flask-32oz-wide-mouth",
                "description": "TempShield double-wall vacuum insulation keeps drinks ice cold up to 24 hours or piping hot up to 12 hours, with pro-grade stainless steel and flex cap.",
                "price": 3899.0,
                "original_price": 4500.0,
                "stock": 45,
                "category_id": cat_map["Fitness & Lifestyle"],
                "brand": "Hydro Flask",
                "rating": 4.9,
                "review_count": 390,
                "image_url": "https://images.unsplash.com/photo-1544816155-12df9643f363?w=800&q=80",
                "features": "TempShield Double-Wall Vacuum Insulation\nPro-Grade 18/8 Stainless Steel (BPA-Free)\nColor Last Powder Coat Dishwasher Safe\nKeeps Cold 24 Hours / Hot 12 Hours",
                "specifications": json.dumps({"Capacity": "32 oz (946 ml)", "Diameter": "9.1 cm", "Height": "24 cm", "Weight": "430g"}),
                "is_featured": False
            }
        ]

        for p_data in products_data:
            existing = db.query(Product).filter(Product.slug == p_data["slug"]).first()
            if not existing:
                prod = Product(**p_data)
                db.add(prod)
        db.commit()

    # 4. Create Coupons
    coupons_data = [
        {"code": "SMART10", "discount_percentage": 10.0, "max_discount_amount": 1500.0, "min_order_amount": 1000.0},
        {"code": "WELCOME15", "discount_percentage": 15.0, "max_discount_amount": 2500.0, "min_order_amount": 2000.0},
        {"code": "SUPER20", "discount_percentage": 20.0, "max_discount_amount": 5000.0, "min_order_amount": 5000.0},
        {"code": "COLLEGE500", "discount_percentage": 12.0, "max_discount_amount": 1200.0, "min_order_amount": 1500.0}
    ]
    for c in coupons_data:
        if not db.query(Coupon).filter(Coupon.code == c["code"]).first():
            db.add(Coupon(**c))
    db.commit()

    # 5. Seed Snap2Price multi-retailer listings, historical price trends & demo alerts
    from app.seed.snap2price_seed import seed_snap2price_data
    seed_snap2price_data(db)

    # 6. Fit the recommender model with all products
    all_products = db.query(Product).all()
    recommender.fit(all_products)
    print(f"Successfully seeded database with {len(all_products)} products across 6 categories!")
