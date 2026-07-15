from database import engine, Base, init_db
from sqlalchemy import MetaData

# Drop all tables
meta = Base.metadata
meta.reflect(bind=engine)
meta.drop_all(bind=engine)

# Re-create and seed
init_db()
print("Database has been reset and seeded successfully.")
