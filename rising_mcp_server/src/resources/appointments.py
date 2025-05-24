from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
from mcp.types import Resource
from src.bms_client import bms_client
from src.logger import get_logger

logger = get_logger(__name__)


class AppointmentResources:
    """Resources for reading appointment data from BMS"""
    
    @staticmethod
    async def list_resources() -> List[Resource]:
        """List available appointment resources"""
        return [
            Resource(
                uri="bms://appointments/list",
                name="Appointment List",
                description="Get a list of all appointments with optional filtering",
                mimeType="application/json"
            ),
            Resource(
                uri="bms://appointments/upcoming",
                name="Upcoming Appointments",
                description="Get upcoming appointments (next 7 days)",
                mimeType="application/json"
            ),
            Resource(
                uri="bms://appointments/today",
                name="Today's Appointments",
                description="Get all appointments scheduled for today",
                mimeType="application/json"
            ),
            Resource(
                uri="bms://appointments/calendar",
                name="Appointment Calendar",
                description="Get appointments in calendar format for a date range",
                mimeType="application/json"
            ),
            Resource(
                uri="bms://appointments/stats",
                name="Appointment Statistics",
                description="Get appointment statistics and analytics",
                mimeType="application/json"
            ),
            Resource(
                uri="bms://appointments/by-status",
                name="Appointments by Status",
                description="Get appointments grouped by their status",
                mimeType="application/json"
            )
        ]
    
    @staticmethod
    async def read_resource(uri: str, params: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Read a specific appointment resource"""
        if uri == "bms://appointments/list":
            limit = params.get("limit", 50) if params else 50
            offset = params.get("offset", 0) if params else 0
            status = params.get("status") if params else None
            
            result = await bms_client.get_appointments(
                limit=limit,
                offset=offset,
                status=status
            )
            return {
                "type": "appointment_list",
                "data": result,
                "metadata": {
                    "limit": limit,
                    "offset": offset,
                    "status": status
                }
            }
            
        elif uri == "bms://appointments/upcoming":
            result = await bms_client.get_appointments(limit=100, upcoming=True)
            return {
                "type": "upcoming_appointments",
                "data": result,
                "metadata": {
                    "upcoming": True,
                    "days_ahead": 7
                }
            }
            
        elif uri == "bms://appointments/today":
            # Get today's appointments
            today = datetime.utcnow().date()
            all_upcoming = await bms_client.get_appointments(limit=100, upcoming=True)
            
            today_appointments = []
            for apt in all_upcoming.get("appointments", []):
                apt_date = datetime.fromisoformat(apt["scheduledAt"].replace("Z", "+00:00")).date()
                if apt_date == today:
                    today_appointments.append(apt)
            
            return {
                "type": "today_appointments",
                "data": {
                    "appointments": today_appointments,
                    "total": len(today_appointments)
                },
                "metadata": {
                    "date": today.isoformat()
                }
            }
            
        elif uri == "bms://appointments/calendar":
            # Get appointments in calendar format
            start_date = params.get("start_date") if params else None
            end_date = params.get("end_date") if params else None
            
            if not start_date:
                start_date = datetime.utcnow().date()
            else:
                start_date = datetime.fromisoformat(start_date).date()
                
            if not end_date:
                end_date = start_date + timedelta(days=30)
            else:
                end_date = datetime.fromisoformat(end_date).date()
            
            # Get all appointments and filter by date range
            all_appointments = await bms_client.get_appointments(limit=200)
            calendar_data = {}
            
            for apt in all_appointments.get("appointments", []):
                apt_date = datetime.fromisoformat(apt["scheduledAt"].replace("Z", "+00:00")).date()
                if start_date <= apt_date <= end_date:
                    date_key = apt_date.isoformat()
                    if date_key not in calendar_data:
                        calendar_data[date_key] = []
                    calendar_data[date_key].append(apt)
            
            return {
                "type": "appointment_calendar",
                "data": calendar_data,
                "metadata": {
                    "start_date": start_date.isoformat(),
                    "end_date": end_date.isoformat()
                }
            }
            
        elif uri == "bms://appointments/stats":
            result = await bms_client.get_appointment_stats()
            return {
                "type": "appointment_statistics",
                "data": result
            }
            
        elif uri == "bms://appointments/by-status":
            # Get appointments grouped by status
            statuses = ["scheduled", "in_progress", "completed", "cancelled", "no_show"]
            grouped = {}
            
            for status in statuses:
                result = await bms_client.get_appointments(limit=20, status=status)
                grouped[status] = result
            
            return {
                "type": "appointments_by_status",
                "data": grouped,
                "metadata": {
                    "statuses": statuses
                }
            }
            
        elif uri.startswith("bms://appointments/"):
            # Handle specific appointment by ID
            appointment_id = uri.split("/")[-1]
            result = await bms_client.get_appointment(appointment_id)
            return {
                "type": "appointment_detail",
                "data": result
            }
            
        else:
            raise ValueError(f"Unknown appointment resource: {uri}")


appointment_resources = AppointmentResources()