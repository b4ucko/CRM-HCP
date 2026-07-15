import os
import json
from datetime import datetime
from sqlalchemy import create_engine, Column, Integer, String, DateTime
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

DATABASE_URL = os.environ.get("DATABASE_URL", "sqlite:///./crm_hcp.db")

if DATABASE_URL.startswith("sqlite"):
    engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
else:
    engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class Interaction(Base):
    __tablename__ = "interactions"

    id = Column(Integer, primary_key=True, index=True)
    hcp_name = Column(String, index=True)
    date = Column(String)  # YYYY-MM-DD
    sentiment = Column(String)  # Positive, Neutral, Negative
    topics = Column(String)  # JSON list
    materials = Column(String)  # JSON list
    next_steps = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_db():
    Base.metadata.create_all(bind=engine)
    
    # Seed mock data if database is empty
    db = SessionLocal()
    try:
        if db.query(Interaction).count() == 0:
            mock_interactions = [
                Interaction(
                    hcp_name="Dr. Alice Smith",
                    date="2026-06-15",
                    sentiment="Positive",
                    topics=json.dumps(["Cardiology", "Beta Blockers Efficacy", "Side Effect Profile"]),
                    materials=json.dumps(["Beta Blocker Clinical Trial PDF", "Brochure V2"]),
                    next_steps="Follow-up scheduled on 2026-07-20 to discuss patient enrollment metrics."
                ),
                Interaction(
                    hcp_name="Dr. Alice Smith",
                    date="2026-07-02",
                    sentiment="Neutral",
                    topics=json.dumps(["Patient Enrollment", "Drug Interactions"]),
                    materials=json.dumps(["Drug-Drug Compatibility Sheet"]),
                    next_steps="Provide updated safety datasheet next visit."
                ),
                Interaction(
                    hcp_name="Dr. Bob Jones",
                    date="2026-06-20",
                    sentiment="Negative",
                    topics=json.dumps(["Oncology", "Immunotherapy cost", "Insurance approval delay"]),
                    materials=json.dumps(["Financial Copay Support Guide"]),
                    next_steps="Follow-up on 2026-07-18 to confirm copay approval."
                ),
                Interaction(
                    hcp_name="Dr. Carol Evans",
                    date="2026-07-08",
                    sentiment="Positive",
                    topics=json.dumps(["Pediatrics", "Vaccine Distribution", "Cold Chain Logistics"]),
                    materials=json.dumps(["Vaccine Storage Guidelines", "Logistics Brochure"]),
                    next_steps="Schedule follow-up for August check-in."
                )
            ]
            db.bulk_save_objects(mock_interactions)
            db.commit()
            print("Database seeded with mock HCP interaction history.")
    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    init_db()
