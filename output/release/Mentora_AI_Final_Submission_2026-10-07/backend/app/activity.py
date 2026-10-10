from datetime import date, datetime, timedelta
from sqlalchemy import select
from .models import Activity


def record_activity(db, user_id, kind, detail):
    db.add(Activity(user_id=user_id, kind=kind, detail=detail))


def streak_summary(db, user_id):
    activities = db.scalars(select(Activity).where(Activity.user_id == user_id).order_by(Activity.created_at.desc())).all()
    days = sorted({a.created_at.date() for a in activities}, reverse=True)
    if not days: return {"current":0,"longest":0}
    today = datetime.utcnow().date()
    current = 0
    cursor = today
    if days[0] < today - timedelta(days=1): cursor = None
    elif days[0] == today - timedelta(days=1): cursor = days[0]
    day_set = set(days)
    while cursor and cursor in day_set:
        current += 1; cursor -= timedelta(days=1)
    longest = run = 1
    for previous, following in zip(days, days[1:]):
        run = run + 1 if previous - following == timedelta(days=1) else 1
        longest = max(longest, run)
    return {"current":current,"longest":longest}
