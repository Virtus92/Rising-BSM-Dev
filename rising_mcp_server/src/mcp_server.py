import asyncio
from typing import List, Dict, Any, Optional
from mcp.server import Server
from mcp.server.models import InitializationOptions
from mcp.types import Resource, Tool, TextContent, Prompt, PromptMessage

from src.config import settings
from src.logger import get_logger
from src.auth import auth_client

# Import resources
from src.resources.customers import customer_resources
from src.resources.requests import request_resources
from src.resources.appointments import appointment_resources
from src.resources.dashboard import dashboard_resources

# Import tools
from src.tools.customer_tools import customer_tools
from src.tools.request_tools import request_tools
from src.tools.appointment_tools import appointment_tools
from src.tools.automation_tools import automation_tools
from src.tools.auth_tools import auth_tools

logger = get_logger(__name__)


class BMSMCPServer:
    def __init__(self):
        self.server = Server(settings.mcp_server_name)
        self._setup_handlers()
        
    def _setup_handlers(self):
        """Setup all MCP server handlers"""
        
        @self.server.list_resources()
        async def handle_list_resources() -> List[Resource]:
            """List all available resources"""
            all_resources = []
            
            # Collect resources from all modules
            all_resources.extend(await customer_resources.list_resources())
            all_resources.extend(await request_resources.list_resources())
            all_resources.extend(await appointment_resources.list_resources())
            all_resources.extend(await dashboard_resources.list_resources())
            
            logger.info(f"Listed {len(all_resources)} resources")
            return all_resources
        
        @self.server.read_resource()
        async def handle_read_resource(uri: str) -> str:
            """Read a specific resource"""
            logger.info(f"Reading resource: {uri}")
            
            try:
                # Route to appropriate resource handler based on URI
                if uri.startswith("bms://customers/"):
                    result = await customer_resources.read_resource(uri)
                elif uri.startswith("bms://requests/"):
                    result = await request_resources.read_resource(uri)
                elif uri.startswith("bms://appointments/"):
                    result = await appointment_resources.read_resource(uri)
                elif uri.startswith("bms://dashboard/") or uri.startswith("bms://users/"):
                    result = await dashboard_resources.read_resource(uri)
                else:
                    raise ValueError(f"Unknown resource URI: {uri}")
                
                # Convert result to JSON string
                import json
                return json.dumps(result, indent=2)
                
            except Exception as e:
                logger.error(f"Error reading resource {uri}: {e}")
                raise
        
        @self.server.list_tools()
        async def handle_list_tools() -> List[Tool]:
            """List all available tools"""
            all_tools = []
            
            # Collect tools from all modules
            all_tools.extend(customer_tools.list_tools())
            all_tools.extend(request_tools.list_tools())
            all_tools.extend(appointment_tools.list_tools())
            all_tools.extend(automation_tools.list_tools())
            all_tools.extend(auth_tools.list_tools())
            
            logger.info(f"Listed {len(all_tools)} tools")
            return all_tools
        
        @self.server.call_tool()
        async def handle_call_tool(name: str, arguments: Optional[Dict[str, Any]] = None) -> List[TextContent]:
            """Execute a tool"""
            logger.info(f"Calling tool: {name} with arguments: {arguments}")
            
            try:
                # Route to appropriate tool handler based on name
                if name.startswith("customer_"):
                    result = await customer_tools.execute_tool(name, arguments or {})
                elif name.startswith("request_"):
                    result = await request_tools.execute_tool(name, arguments or {})
                elif name.startswith("appointment_"):
                    result = await appointment_tools.execute_tool(name, arguments or {})
                elif name.startswith("automation_") or name.startswith("workflow_"):
                    result = await automation_tools.execute_tool(name, arguments or {})
                elif name.startswith("auth_"):
                    result = await auth_tools.execute_tool(name, arguments or {})
                else:
                    raise ValueError(f"Unknown tool: {name}")
                
                return result
                
            except Exception as e:
                logger.error(f"Error executing tool {name}: {e}")
                return [TextContent(
                    type="text",
                    text=f"Error executing tool {name}: {str(e)}"
                )]
        
        @self.server.list_prompts()
        async def handle_list_prompts() -> List[Prompt]:
            """List all available prompts"""
            prompts = [
                # Customer Service Prompts
                Prompt(
                    name="process_new_request",
                    description="Process a new service request from a customer",
                    arguments=[
                        {"name": "request_id", "description": "ID of the request to process", "required": True}
                    ]
                ),
                Prompt(
                    name="follow_up_pending",
                    description="Follow up on pending requests that need attention",
                    arguments=[
                        {"name": "days_pending", "description": "Number of days pending", "required": False}
                    ]
                ),
                Prompt(
                    name="customer_report",
                    description="Generate a detailed report for a customer",
                    arguments=[
                        {"name": "customer_id", "description": "ID of the customer", "required": True},
                        {"name": "report_type", "description": "Type of report (summary, detailed, activity)", "required": False}
                    ]
                ),
                
                # Scheduling Prompts
                Prompt(
                    name="find_appointment_slot",
                    description="Find optimal appointment time for a customer",
                    arguments=[
                        {"name": "customer_id", "description": "ID of the customer", "required": True},
                        {"name": "duration_minutes", "description": "Required duration", "required": True},
                        {"name": "preferred_times", "description": "Preferred time slots", "required": False}
                    ]
                ),
                Prompt(
                    name="reschedule_conflicts",
                    description="Identify and resolve appointment conflicts",
                    arguments=[]
                ),
                
                # Analytics Prompts
                Prompt(
                    name="business_analysis",
                    description="Analyze current business performance",
                    arguments=[
                        {"name": "period", "description": "Analysis period (today, week, month)", "required": False}
                    ]
                ),
                Prompt(
                    name="identify_trends",
                    description="Identify trends and patterns in business data",
                    arguments=[
                        {"name": "metric", "description": "Specific metric to analyze", "required": False}
                    ]
                )
            ]
            
            return prompts
        
        @self.server.get_prompt()
        async def handle_get_prompt(name: str, arguments: Optional[Dict[str, Any]] = None) -> Prompt:
            """Get a specific prompt with filled template"""
            logger.info(f"Getting prompt: {name} with arguments: {arguments}")
            
            messages = []
            
            if name == "process_new_request":
                request_id = arguments.get("request_id") if arguments else None
                if not request_id:
                    raise ValueError("request_id is required")
                
                messages = [
                    PromptMessage(
                        role="user",
                        content=TextContent(
                            type="text",
                            text=(
                                f"Process the service request with ID {request_id}. "
                                f"First, read the request details using bms://requests/{request_id}. "
                                f"Then analyze the request and determine: "
                                f"1. Priority level based on content "
                                f"2. Best user to assign it to "
                                f"3. Whether it needs immediate attention "
                                f"4. If it can be converted to an appointment "
                                f"Finally, take appropriate actions using the available tools."
                            )
                        )
                    )
                ]
                
            elif name == "follow_up_pending":
                days = arguments.get("days_pending", 3) if arguments else 3
                messages = [
                    PromptMessage(
                        role="user",
                        content=TextContent(
                            type="text",
                            text=(
                                f"Review all pending requests older than {days} days. "
                                f"Use bms://requests/pending to get the list. "
                                f"For each request: "
                                f"1. Check why it's still pending "
                                f"2. Suggest assignment or next action "
                                f"3. Flag any that need escalation "
                                f"Provide a summary of actions needed."
                            )
                        )
                    )
                ]
                
            elif name == "customer_report":
                customer_id = arguments.get("customer_id") if arguments else None
                report_type = arguments.get("report_type", "summary") if arguments else "summary"
                
                if not customer_id:
                    raise ValueError("customer_id is required")
                
                messages = [
                    PromptMessage(
                        role="user",
                        content=TextContent(
                            type="text",
                            text=(
                                f"Generate a {report_type} report for customer {customer_id}. "
                                f"Include: "
                                f"1. Customer details (use bms://customers/{customer_id}) "
                                f"2. All requests from this customer "
                                f"3. Appointment history "
                                f"4. Current status and any pending items "
                                f"5. Recommendations for next steps"
                            )
                        )
                    )
                ]
                
            elif name == "find_appointment_slot":
                customer_id = arguments.get("customer_id") if arguments else None
                duration = arguments.get("duration_minutes", 60) if arguments else 60
                
                if not customer_id:
                    raise ValueError("customer_id is required")
                
                messages = [
                    PromptMessage(
                        role="user",
                        content=TextContent(
                            type="text",
                            text=(
                                f"Find an optimal appointment slot for customer {customer_id}. "
                                f"Duration needed: {duration} minutes. "
                                f"Check: "
                                f"1. Current appointment calendar (bms://appointments/calendar) "
                                f"2. Customer's previous appointment patterns "
                                f"3. Available time slots in the next 7 days "
                                f"Suggest the best 3 time slots with reasoning."
                            )
                        )
                    )
                ]
                
            elif name == "business_analysis":
                period = arguments.get("period", "today") if arguments else "today"
                messages = [
                    PromptMessage(
                        role="user",
                        content=TextContent(
                            type="text",
                            text=(
                                f"Perform a comprehensive business analysis for {period}. "
                                f"Use these resources: "
                                f"1. bms://dashboard/overview for current metrics "
                                f"2. bms://dashboard/kpis for performance indicators "
                                f"3. bms://dashboard/alerts for issues needing attention "
                                f"Provide: "
                                f"- Executive summary "
                                f"- Key achievements "
                                f"- Areas of concern "
                                f"- Recommended actions"
                            )
                        )
                    )
                ]
                
            else:
                raise ValueError(f"Unknown prompt: {name}")
            
            return Prompt(
                name=name,
                description=f"Executing prompt: {name}",
                messages=messages
            )
    
    async def run(self):
        """Run the MCP server"""
        logger.info(f"Starting {settings.mcp_server_name} v{settings.mcp_server_version}")
        
        # Initialize with service account
        try:
            service_info = await auth_client.get_service_account_info()
            logger.info(f"Authenticated as service account: {service_info.get('email', 'Unknown')}")
        except Exception as e:
            logger.error(f"Failed to authenticate service account: {e}")
            raise
        
        # Run the server
        async with self.server.run_stdio():
            # The server will run until interrupted
            await asyncio.Event().wait()


async def main():
    """Main entry point"""
    server = BMSMCPServer()
    await server.run()


if __name__ == "__main__":
    asyncio.run(main())