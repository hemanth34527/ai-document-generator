#!/usr/bin/env python3
"""
Setup script to initialize the database and create tables
"""

from app import create_app
from models import db, User

def init_database():
    app = create_app()
    
    with app.app_context():
        print("Creating database tables...")
        db.create_all()
        print("✓ Database tables created successfully!")
        
        # Create a demo user (optional)
        demo_user = User.query.filter_by(username='demo').first()
        if not demo_user:
            demo_user = User(username='demo', email='demo@oceanai.com')
            demo_user.set_password('demo123')
            db.session.add(demo_user)
            db.session.commit()
            print("✓ Demo user created (username: demo, password: demo123)")

if __name__ == '__main__':
    init_database()
