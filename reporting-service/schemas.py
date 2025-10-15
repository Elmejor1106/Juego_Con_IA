from pydantic import BaseModel
from typing import Optional
from enum import Enum
from datetime import date

class UserReportType(str, Enum):
    ALL_USERS = "ALL_USERS"
    ACTIVE_VS_INACTIVE = "ACTIVE_VS_INACTIVE"
    REGISTERED_BY_DAY = "REGISTERED_BY_DAY"

class GameReportType(str, Enum):
    ALL_GAMES = "ALL_GAMES"
    TOP_10_MOST_PLAYED = "TOP_10_MOST_PLAYED"
    CREATED_BY_DATE = "CREATED_BY_DATE"

class ReportRequest(BaseModel):
    start_date: Optional[date] = None
    end_date: Optional[date] = None

class UserReportRequest(ReportRequest):
    report_type: UserReportType

class GameReportRequest(ReportRequest):
    report_type: GameReportType
