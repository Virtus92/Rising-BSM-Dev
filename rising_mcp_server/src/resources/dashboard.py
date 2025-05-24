from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
from mcp.types import Resource
from src.bms_client import bms_client
from src.logger import get_logger

logger = get_logger(__name__)


class DashboardResources:
    """Resources for reading dashboard and analytics data from BMS"""
    
    @staticmethod
    async def list_resources() -> List[Resource]:
        """List available dashboard resources"""
        return [
            Resource(
                uri="bms://dashboard/overview",
                name="Dashboard Overview",
                description="Get complete dashboard overview with all key metrics",
                mimeType="application/json"
            ),
            Resource(
                uri="bms://dashboard/kpis",
                name="Key Performance Indicators",
                description="Get current KPIs and business metrics",
                mimeType="application/json"
            ),
            Resource(
                uri="bms://dashboard/trends",
                name="Business Trends",
                description="Get trend analysis for key metrics",
                mimeType="application/json"
            ),
            Resource(
                uri="bms://dashboard/alerts",
                name="Business Alerts",
                description="Get alerts and notifications requiring attention",
                mimeType="application/json"
            ),
            Resource(
                uri="bms://users/list",
                name="User List",
                description="Get list of system users",
                mimeType="application/json"
            ),
            Resource(
                uri="bms://users/active",
                name="Active Users",
                description="Get list of currently active users",
                mimeType="application/json"
            )
        ]
    
    @staticmethod
    async def read_resource(uri: str, params: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Read a specific dashboard resource"""
        if uri == "bms://dashboard/overview":
            # Get comprehensive dashboard data
            stats = await bms_client.get_dashboard_stats()
            
            # Calculate some additional metrics
            customer_stats = stats["customers"]
            request_stats = stats["requests"]
            appointment_stats = stats["appointments"]
            
            overview = {
                "summary": {
                    "total_customers": customer_stats.get("total", 0),
                    "active_customers": customer_stats.get("active", 0),
                    "total_requests": request_stats.get("total", 0),
                    "pending_requests": request_stats.get("pending", 0),
                    "total_appointments": appointment_stats.get("total", 0),
                    "upcoming_appointments": appointment_stats.get("upcoming", 0),
                },
                "metrics": {
                    "customer_growth": customer_stats.get("growth_percentage", 0),
                    "request_completion_rate": request_stats.get("completion_rate", 0),
                    "appointment_completion_rate": appointment_stats.get("completion_rate", 0),
                    "average_response_time": request_stats.get("avg_response_time", 0),
                },
                "timestamp": stats["timestamp"]
            }
            
            return {
                "type": "dashboard_overview",
                "data": overview
            }
            
        elif uri == "bms://dashboard/kpis":
            stats = await bms_client.get_dashboard_stats()
            
            kpis = {
                "customers": {
                    "total": stats["customers"].get("total", 0),
                    "active": stats["customers"].get("active", 0),
                    "new_this_month": stats["customers"].get("new_this_month", 0),
                    "churn_rate": stats["customers"].get("churn_rate", 0),
                },
                "requests": {
                    "total": stats["requests"].get("total", 0),
                    "pending": stats["requests"].get("pending", 0),
                    "completed_this_month": stats["requests"].get("completed_this_month", 0),
                    "average_completion_time": stats["requests"].get("avg_completion_time", 0),
                },
                "appointments": {
                    "total": stats["appointments"].get("total", 0),
                    "upcoming": stats["appointments"].get("upcoming", 0),
                    "completed_this_month": stats["appointments"].get("completed_this_month", 0),
                    "no_show_rate": stats["appointments"].get("no_show_rate", 0),
                },
                "performance": {
                    "customer_satisfaction": stats.get("customer_satisfaction", 0),
                    "nps_score": stats.get("nps_score", 0),
                    "efficiency_score": stats.get("efficiency_score", 0),
                }
            }
            
            return {
                "type": "key_performance_indicators",
                "data": kpis,
                "timestamp": datetime.utcnow().isoformat()
            }
            
        elif uri == "bms://dashboard/trends":
            # Calculate trends based on current stats
            stats = await bms_client.get_dashboard_stats()
            
            trends = {
                "customer_trends": {
                    "weekly_growth": stats["customers"].get("weekly_growth", []),
                    "monthly_growth": stats["customers"].get("monthly_growth", []),
                    "status_distribution": stats["customers"].get("status_distribution", {}),
                },
                "request_trends": {
                    "daily_volume": stats["requests"].get("daily_volume", []),
                    "completion_trends": stats["requests"].get("completion_trends", []),
                    "category_distribution": stats["requests"].get("category_distribution", {}),
                },
                "appointment_trends": {
                    "weekly_bookings": stats["appointments"].get("weekly_bookings", []),
                    "completion_rate_trend": stats["appointments"].get("completion_rate_trend", []),
                    "peak_hours": stats["appointments"].get("peak_hours", {}),
                }
            }
            
            return {
                "type": "business_trends",
                "data": trends,
                "timestamp": datetime.utcnow().isoformat()
            }
            
        elif uri == "bms://dashboard/alerts":
            # Generate business alerts based on current data
            stats = await bms_client.get_dashboard_stats()
            alerts = []
            
            # Check for high pending requests
            pending_requests = stats["requests"].get("pending", 0)
            if pending_requests > 10:
                alerts.append({
                    "type": "warning",
                    "category": "requests",
                    "message": f"{pending_requests} requests are pending assignment",
                    "priority": "high" if pending_requests > 20 else "medium",
                    "action": "assign_requests"
                })
            
            # Check for upcoming appointments
            upcoming = stats["appointments"].get("upcoming", 0)
            if upcoming > 0:
                alerts.append({
                    "type": "info",
                    "category": "appointments",
                    "message": f"{upcoming} appointments scheduled for the next 7 days",
                    "priority": "low",
                    "action": "review_appointments"
                })
            
            # Check completion rates
            request_completion = stats["requests"].get("completion_rate", 100)
            if request_completion < 80:
                alerts.append({
                    "type": "warning",
                    "category": "performance",
                    "message": f"Request completion rate is {request_completion}% (below target)",
                    "priority": "medium",
                    "action": "review_performance"
                })
            
            return {
                "type": "business_alerts",
                "data": {
                    "alerts": alerts,
                    "total": len(alerts),
                    "by_priority": {
                        "high": len([a for a in alerts if a["priority"] == "high"]),
                        "medium": len([a for a in alerts if a["priority"] == "medium"]),
                        "low": len([a for a in alerts if a["priority"] == "low"])
                    }
                },
                "timestamp": datetime.utcnow().isoformat()
            }
            
        elif uri == "bms://users/list":
            result = await bms_client.get_users(active_only=False)
            return {
                "type": "user_list",
                "data": result
            }
            
        elif uri == "bms://users/active":
            result = await bms_client.get_users(active_only=True)
            return {
                "type": "active_users",
                "data": result,
                "metadata": {
                    "active_only": True
                }
            }
            
        elif uri.startswith("bms://users/"):
            # Handle specific user by ID
            user_id = uri.split("/")[-1]
            result = await bms_client.get_user(user_id)
            return {
                "type": "user_detail",
                "data": result
            }
            
        else:
            raise ValueError(f"Unknown dashboard resource: {uri}")


dashboard_resources = DashboardResources()