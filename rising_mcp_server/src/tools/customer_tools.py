from typing import Dict, Any, List, Optional
from mcp.types import Tool, TextContent
from pydantic import BaseModel, Field
from src.bms_client import bms_client
from src.logger import get_logger

logger = get_logger(__name__)


class CreateCustomerInput(BaseModel):
    name: str = Field(..., description="Customer name")
    email: str = Field(..., description="Customer email address")
    phone: Optional[str] = Field(None, description="Customer phone number")
    company: Optional[str] = Field(None, description="Company name")
    address: Optional[str] = Field(None, description="Customer address")
    notes: Optional[str] = Field(None, description="Initial notes about the customer")


class UpdateCustomerInput(BaseModel):
    customer_id: str = Field(..., description="Customer ID to update")
    name: Optional[str] = Field(None, description="Updated customer name")
    email: Optional[str] = Field(None, description="Updated email address")
    phone: Optional[str] = Field(None, description="Updated phone number")
    company: Optional[str] = Field(None, description="Updated company name")
    address: Optional[str] = Field(None, description="Updated address")
    status: Optional[str] = Field(None, description="Updated status (active, inactive, lead)")


class AddCustomerNoteInput(BaseModel):
    customer_id: str = Field(..., description="Customer ID to add note to")
    note: str = Field(..., description="Note content to add")


class ChangeCustomerStatusInput(BaseModel):
    customer_id: str = Field(..., description="Customer ID to update status")
    status: str = Field(..., description="New status (active, inactive, lead)")
    reason: Optional[str] = Field(None, description="Reason for status change")


class CustomerTools:
    """Tools for managing customers in BMS"""
    
    @staticmethod
    def list_tools() -> List[Tool]:
        """List available customer management tools"""
        return [
            Tool(
                name="customer_create",
                description="Create a new customer in the BMS",
                inputSchema=CreateCustomerInput.schema()
            ),
            Tool(
                name="customer_update",
                description="Update existing customer information",
                inputSchema=UpdateCustomerInput.schema()
            ),
            Tool(
                name="customer_add_note",
                description="Add a note to a customer record",
                inputSchema=AddCustomerNoteInput.schema()
            ),
            Tool(
                name="customer_change_status",
                description="Change customer status (active, inactive, lead)",
                inputSchema=ChangeCustomerStatusInput.schema()
            )
        ]
    
    @staticmethod
    async def execute_tool(tool_name: str, arguments: Dict[str, Any]) -> List[TextContent]:
        """Execute a customer management tool"""
        try:
            if tool_name == "customer_create":
                input_data = CreateCustomerInput(**arguments)
                
                customer_data = {
                    "name": input_data.name,
                    "email": input_data.email,
                    "phone": input_data.phone,
                    "company": input_data.company,
                    "address": input_data.address,
                    "status": "active"
                }
                
                result = await bms_client.create_customer(customer_data)
                
                # Add initial note if provided
                if input_data.notes:
                    await bms_client.add_customer_note(result["id"], input_data.notes)
                
                return [TextContent(
                    type="text",
                    text=f"Successfully created customer '{input_data.name}' with ID: {result['id']}"
                )]
                
            elif tool_name == "customer_update":
                input_data = UpdateCustomerInput(**arguments)
                
                update_data = {}
                if input_data.name:
                    update_data["name"] = input_data.name
                if input_data.email:
                    update_data["email"] = input_data.email
                if input_data.phone:
                    update_data["phone"] = input_data.phone
                if input_data.company:
                    update_data["company"] = input_data.company
                if input_data.address:
                    update_data["address"] = input_data.address
                if input_data.status:
                    update_data["status"] = input_data.status
                
                result = await bms_client.update_customer(input_data.customer_id, update_data)
                
                return [TextContent(
                    type="text",
                    text=f"Successfully updated customer {input_data.customer_id}"
                )]
                
            elif tool_name == "customer_add_note":
                input_data = AddCustomerNoteInput(**arguments)
                
                result = await bms_client.add_customer_note(
                    input_data.customer_id,
                    input_data.note
                )
                
                return [TextContent(
                    type="text",
                    text=f"Successfully added note to customer {input_data.customer_id}"
                )]
                
            elif tool_name == "customer_change_status":
                input_data = ChangeCustomerStatusInput(**arguments)
                
                # Update status
                update_data = {"status": input_data.status}
                result = await bms_client.update_customer(input_data.customer_id, update_data)
                
                # Add note about status change if reason provided
                if input_data.reason:
                    note = f"Status changed to {input_data.status}: {input_data.reason}"
                    await bms_client.add_customer_note(input_data.customer_id, note)
                
                return [TextContent(
                    type="text",
                    text=f"Successfully changed customer {input_data.customer_id} status to {input_data.status}"
                )]
                
            else:
                raise ValueError(f"Unknown customer tool: {tool_name}")
                
        except Exception as e:
            logger.error(f"Error executing customer tool {tool_name}: {e}")
            return [TextContent(
                type="text",
                text=f"Error executing {tool_name}: {str(e)}"
            )]


customer_tools = CustomerTools()