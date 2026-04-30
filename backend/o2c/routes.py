"""O2C API Routes for Global Solution Orchestrator."""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

from o2c.orchestrator import (
    O2COrchestrator,
    ScenarioLoader,
    GLAccountMapping,
    ARAgingCalculator,
    OrderStatus,
)

router = APIRouter(prefix="/api/o2c", tags=["o2c"])
orchestrator = O2COrchestrator()


# Request/Response Models
class CreateOrderRequest(BaseModel):
    customer: str
    order_value: float
    currency: str = "EUR"
    engagement_type: str = "T&M"


class OrderResponse(BaseModel):
    order_number: str
    customer: str
    order_value: float
    currency: str
    status: str
    engagement_type: str
    completion_percentage: float
    created_date: str


class UpdateProgressRequest(BaseModel):
    order_number: str
    completion_percentage: float


class GLPostingResponse(BaseModel):
    account: str
    amount: float
    type: str
    description: str


class ARAgingResponse(BaseModel):
    bucket: str
    days_overdue: int
    amount: float
    dunning_level: int
    next_action: str
    late_fees: float


class ScenarioResponse(BaseModel):
    id: str
    name: str
    engagement_type: str
    total_value: float
    currency: str


class GLAccountResponse(BaseModel):
    account: str
    name: str
    type: str


# Routes
@router.post("/orders", response_model=OrderResponse)
async def create_order(request: CreateOrderRequest) -> OrderResponse:
    """Create new sales order."""
    try:
        order = orchestrator.create_order(
            customer=request.customer,
            order_value=request.order_value,
            currency=request.currency,
            engagement_type=request.engagement_type,
        )

        return OrderResponse(
            order_number=order.order_number,
            customer=order.customer,
            order_value=order.order_value,
            currency=order.currency,
            status=order.status.value,
            engagement_type=order.engagement_type.value,
            completion_percentage=order.completion_percentage,
            created_date=order.created_date.isoformat(),
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/orders/{order_number}", response_model=OrderResponse)
async def get_order(order_number: str) -> OrderResponse:
    """Retrieve order details."""
    order = orchestrator.get_order(order_number)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    return OrderResponse(
        order_number=order.order_number,
        customer=order.customer,
        order_value=order.order_value,
        currency=order.currency,
        status=order.status.value,
        engagement_type=order.engagement_type.value,
        completion_percentage=order.completion_percentage,
        created_date=order.created_date.isoformat(),
    )


@router.post("/orders/progress", response_model=OrderResponse)
async def update_progress(request: UpdateProgressRequest) -> OrderResponse:
    """Update order progress (revenue recognition %)."""
    order = orchestrator.update_order_progress(
        request.order_number,
        request.completion_percentage,
    )

    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    return OrderResponse(
        order_number=order.order_number,
        customer=order.customer,
        order_value=order.order_value,
        currency=order.currency,
        status=order.status.value,
        engagement_type=order.engagement_type.value,
        completion_percentage=order.completion_percentage,
        created_date=order.created_date.isoformat(),
    )


@router.get("/orders/{order_number}/gl-posting", response_model=List[GLPostingResponse])
async def get_gl_postings(order_number: str) -> List[GLPostingResponse]:
    """Calculate GL postings for order."""
    postings = orchestrator.calculate_gl_impact(order_number)

    if not postings:
        raise HTTPException(status_code=404, detail="Order not found or no GL impact")

    return [
        GLPostingResponse(
            account=p.account,
            amount=p.amount,
            type=p.type,
            description=p.description,
        )
        for p in postings
    ]


@router.get("/orders/{order_number}/ar-aging", response_model=List[ARAgingResponse])
async def get_ar_aging(order_number: str, invoice_date: Optional[str] = None) -> List[ARAgingResponse]:
    """Calculate AR aging and dunning escalation."""
    order = orchestrator.get_order(order_number)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    # Use provided invoice date or assume order creation date
    if invoice_date:
        inv_date = datetime.fromisoformat(invoice_date)
    else:
        inv_date = order.created_date

    aging = ARAgingCalculator.calculate_aging(inv_date, order.order_value)

    return [
        ARAgingResponse(
            bucket=a.bucket,
            days_overdue=a.days_overdue,
            amount=a.amount,
            dunning_level=a.dunning_level,
            next_action=a.next_action,
            late_fees=a.late_fees,
        )
        for a in aging
    ]


@router.get("/scenarios", response_model=List[ScenarioResponse])
async def list_scenarios() -> List[ScenarioResponse]:
    """List available PS scenarios (6 types)."""
    scenarios = ScenarioLoader.list_scenarios()
    return [
        ScenarioResponse(
            id=s["id"],
            name=s["name"],
            engagement_type=s["engagement_type"],
            total_value=s["total_value"],
            currency=s["currency"],
        )
        for s in scenarios
    ]


@router.get("/scenarios/{scenario_id}")
async def get_scenario(scenario_id: str) -> dict:
    """Get detailed scenario by ID."""
    scenario = ScenarioLoader.get_scenario(scenario_id)
    if not scenario:
        raise HTTPException(status_code=404, detail="Scenario not found")
    return scenario


@router.get("/gl-accounts", response_model=List[GLAccountResponse])
async def list_gl_accounts() -> List[GLAccountResponse]:
    """List O2C-related GL accounts."""
    accounts = GLAccountMapping.list_accounts()
    return [
        GLAccountResponse(
            account=a["account"],
            name=a["name"],
            type=a["type"],
        )
        for a in accounts
    ]


@router.get("/gl-accounts/{account_code}")
async def get_gl_account(account_code: str) -> dict:
    """Get GL account details."""
    account = GLAccountMapping.get_account(account_code)
    if not account:
        raise HTTPException(status_code=404, detail="GL Account not found")
    return {"account": account_code, **account}


@router.get("/orders/{order_number}/export/solution-builder")
async def export_solution_builder(order_number: str):
    """Export order configuration as SAP Solution Builder XML template."""
    order = orchestrator.get_order(order_number)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    xml_content = orchestrator.export_as_solution_builder_xml(order_number)

    return {
        "filename": f"O2C-SolutionBuilder-{order_number}.xml",
        "content": xml_content,
        "contentType": "application/xml",
        "order_number": order_number,
        "engagement_type": order.engagement_type,
        "order_value": order.order_value,
        "currency": order.currency,
    }


@router.post("/orders/{order_number}/export/download")
async def download_solution_builder_xml(order_number: str):
    """Download order configuration as XML file (triggers browser download)."""
    order = orchestrator.get_order(order_number)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    xml_content = orchestrator.export_as_solution_builder_xml(order_number)

    from fastapi.responses import Response
    return Response(
        content=xml_content,
        media_type="application/xml",
        headers={"Content-Disposition": f'attachment; filename="O2C-SolutionBuilder-{order_number}.xml"'}
    )


@router.get("/health")
async def health() -> dict:
    """O2C API health check."""
    return {
        "status": "operational",
        "orders_active": len(orchestrator.orders),
        "scenarios_available": len(ScenarioLoader.SCENARIOS),
        "gl_accounts": len(GLAccountMapping.ACCOUNTS),
    }
