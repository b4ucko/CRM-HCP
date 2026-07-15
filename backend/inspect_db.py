from database import SessionLocal, Interaction
import json

db = SessionLocal()
try:
    records = db.query(Interaction).all()
    for r in records:
        print(f"ID: {r.id}")
        print(f"HCP: {r.hcp_name}")
        print(f"Date: {r.date}")
        print(f"Sentiment: {r.sentiment}")
        print(f"Topics: {r.topics} (type: {type(r.topics)})")
        print(f"Materials: {r.materials} (type: {type(r.materials)})")
        print(f"Next Steps: {r.next_steps}")
        print("-" * 40)
finally:
    db.close()
