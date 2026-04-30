"""O2C Global Solution Orchestrator - Business Logic.

Handles Order-to-Cash process with IFRS 15 revenue recognition,
AR aging, and GL posting calculations.
"""

from dataclasses import dataclass
from typing import List, Dict, Optional
from datetime import datetime, timedelta
from enum import Enum


class EngagementType(str, Enum):
    """Professional Services engagement types."""
    TM = "T&M"
    FIXED_PRICE = "Fixed Price"
    RETAINER = "Retainer"


class OrderStatus(str, Enum):
    """Order lifecycle status."""
    DRAFT = "draft"
    SUBMITTED = "submitted"
    CONFIRMED = "confirmed"
    INVOICED = "invoiced"
    POSTED = "posted"


@dataclass
class GLPosting:
    """General Ledger posting entry."""
    account: str
    amount: float
    type: str  # "DR" or "CR"
    description: str


@dataclass
class Order:
    """Sales Order with IFRS 15 compliance."""
    order_number: str
    customer: str
    order_value: float
    currency: str
    status: OrderStatus
    engagement_type: EngagementType
    created_date: datetime
    completion_percentage: float = 0.0

    def get_gl_postings(self) -> List[GLPosting]:
        """Calculate GL postings for current recognition state."""
        postings = []

        # Revenue recognition amount
        revenue_amount = self.order_value * self.completion_percentage

        # Standard O2C GL posting structure
        postings.append(GLPosting(
            account="1200",
            amount=revenue_amount,
            type="DR",
            description=f"A/R Control - {self.customer}"
        ))

        postings.append(GLPosting(
            account="4000",
            amount=revenue_amount,
            type="CR",
            description="Professional Services Revenue"
        ))

        # Tax (19% assumed)
        tax_amount = revenue_amount * 0.19
        postings.append(GLPosting(
            account="2100",
            amount=tax_amount,
            type="DR",
            description="Sales Tax Payable"
        ))

        postings.append(GLPosting(
            account="3000",
            amount=tax_amount,
            type="CR",
            description="Deferred Tax Liability"
        ))

        return postings


@dataclass
class ARAgingBucket:
    """AR aging bucket for collection tracking."""
    bucket: str
    days_overdue: int
    amount: float
    dunning_level: int
    next_action: str
    late_fees: float = 0.0


class ARAgingCalculator:
    """Calculate AR aging and dunning escalation."""

    DUNNING_RULES = {
        0: {"days": 30, "level": 0, "action": "Monitor", "fee": 0},
        1: {"days": 45, "level": 1, "action": "First Reminder", "fee": 0},
        2: {"days": 60, "level": 2, "action": "Second Dunning + €200", "fee": 200},
        3: {"days": 75, "level": 3, "action": "Legal Notice + €500", "fee": 500},
    }

    @staticmethod
    def calculate_aging(invoice_date: datetime, amount: float) -> List[ARAgingBucket]:
        """Simulate AR aging with dunning escalation."""
        today = datetime.now()
        days_outstanding = (today - invoice_date).days

        aging_buckets = []

        # Current (0-30 days)
        aging_buckets.append(ARAgingBucket(
            bucket="Current (0-30)",
            days_overdue=0,
            amount=amount if days_outstanding <= 30 else 0,
            dunning_level=0,
            next_action="Monitor payment"
        ))

        # 31-60 days overdue
        if days_outstanding > 30:
            aging_buckets.append(ARAgingBucket(
                bucket="Overdue 31-60",
                days_overdue=days_outstanding,
                amount=amount * 0.3 if days_outstanding <= 60 else 0,
                dunning_level=1,
                next_action="Send Dunning Letter 1",
                late_fees=200 if days_outstanding > 45 else 0
            ))

        # 61+ days overdue
        if days_outstanding > 60:
            aging_buckets.append(ARAgingBucket(
                bucket="Overdue 61+",
                days_overdue=days_outstanding,
                amount=amount * 0.15,
                dunning_level=2,
                next_action="Send Dunning Letter 2 + Late charges",
                late_fees=500 if days_outstanding > 75 else 200
            ))

        return aging_buckets


class ScenarioLoader:
    """Load predefined PS scenarios."""

    SCENARIOS = {
        "tm": {
            "name": "T&M (Time & Materials) — Monthly Over-Time",
            "engagement_type": "T&M",
            "description": "4-month engagement: 40→40→50→30 hours (160 total @ €250/hr)",
            "total_value": 40000,
            "currency": "EUR",
            "months": 4,
            "revenue_recognition": "Over-time (monthly % complete)",
            "pbo_type": "PS-OT",
        },
        "fixed_price": {
            "name": "Fixed Price — Milestone-Based Point-In-Time",
            "engagement_type": "Fixed Price",
            "description": "4-month project: €75,000 fixed (Core Banking Upgrade)",
            "total_value": 75000,
            "currency": "EUR",
            "months": 4,
            "milestones": {
                "M1": {"name": "Design & Requirements", "percentage": 15, "date": "2026-05-31"},
                "M2": {"name": "Development", "percentage": 40, "date": "2026-06-30"},
                "M3": {"name": "Testing & QA", "percentage": 30, "date": "2026-07-31"},
                "M4": {"name": "Go-Live & Support", "percentage": 15, "date": "2026-08-31"},
            },
            "revenue_recognition": "Point-in-time (milestone completion)",
            "pbo_type": "PS-PIT",
        },
        "retainer": {
            "name": "Retainer — Advance Payment with Monthly Drawdown",
            "engagement_type": "Retainer",
            "description": "24-month engagement: €5,000/month (€120,000 total)",
            "total_value": 120000,
            "currency": "EUR",
            "months": 24,
            "monthly_amount": 5000,
            "advance_payment": 30000,
            "advance_covers_months": 6,
            "revenue_recognition": "Over-time (ratable monthly)",
            "pbo_type": "PS-OT-RETAINER",
        },
    }

    @classmethod
    def get_scenario(cls, scenario_id: str) -> Dict:
        """Get scenario by ID."""
        return cls.SCENARIOS.get(scenario_id, {})

    @classmethod
    def list_scenarios(cls) -> List[Dict]:
        """List all available scenarios."""
        scenarios = []
        for key, scenario in cls.SCENARIOS.items():
            scenarios.append({
                "id": key,
                "name": scenario["name"],
                "engagement_type": scenario["engagement_type"],
                "total_value": scenario["total_value"],
                "currency": scenario["currency"],
            })
        return scenarios


class GLAccountMapping:
    """SAP GL Account mapping for O2C process."""

    ACCOUNTS = {
        "1100": {"name": "Cash", "type": "Asset"},
        "1200": {"name": "A/R Control", "type": "Asset"},
        "1210": {"name": "A/R Subsidiary", "type": "Asset"},
        "1215": {"name": "Contract Asset (Unbilled Revenue)", "type": "Asset"},
        "2100": {"name": "Sales Tax Payable", "type": "Liability"},
        "2110": {"name": "Contract Liability (Deferred Revenue)", "type": "Liability"},
        "3000": {"name": "Deferred Tax Liability", "type": "Liability"},
        "4000": {"name": "Professional Services Revenue", "type": "Revenue"},
        "5000": {"name": "Late Payment Recovery Revenue", "type": "Revenue"},
    }

    @classmethod
    def get_account(cls, account_code: str) -> Optional[Dict]:
        """Get GL account details."""
        return cls.ACCOUNTS.get(account_code)

    @classmethod
    def list_accounts(cls) -> List[Dict]:
        """List all O2C-related GL accounts."""
        accounts = []
        for code, details in cls.ACCOUNTS.items():
            accounts.append({
                "account": code,
                **details
            })
        return accounts


class O2COrchestrator:
    """Main O2C orchestrator for order processing."""

    def __init__(self):
        self.orders: Dict[str, Order] = {}

    def create_order(self, customer: str, order_value: float,
                     currency: str, engagement_type: str) -> Order:
        """Create new sales order."""
        order_number = f"SO-{datetime.now().timestamp()}"

        order = Order(
            order_number=order_number,
            customer=customer,
            order_value=order_value,
            currency=currency,
            status=OrderStatus.DRAFT,
            engagement_type=EngagementType(engagement_type),
            created_date=datetime.now(),
        )

        self.orders[order_number] = order
        return order

    def update_order_progress(self, order_number: str,
                            completion_percentage: float) -> Optional[Order]:
        """Update order progress and revenue recognition."""
        if order_number not in self.orders:
            return None

        order = self.orders[order_number]
        order.completion_percentage = min(completion_percentage, 100.0)

        if order.completion_percentage >= 100.0:
            order.status = OrderStatus.POSTED
        elif order.completion_percentage > 0:
            order.status = OrderStatus.INVOICED

        return order

    def get_order(self, order_number: str) -> Optional[Order]:
        """Retrieve order by number."""
        return self.orders.get(order_number)

    def calculate_gl_impact(self, order_number: str) -> List[GLPosting]:
        """Calculate GL impact for order."""
        order = self.get_order(order_number)
        if not order:
            return []

        return order.get_gl_postings()

    def export_as_solution_builder_xml(self, order_number: str) -> str:
        """Export configured order as SAP Solution Builder XML template."""
        order = self.get_order(order_number)
        if not order:
            return "<error>Order not found</error>"

        gl_postings = order.get_gl_postings()
        ar_aging = ARAgingCalculator.calculate_aging(order.created_date, order.order_value)

        # Get engagement type as string value
        engagement_type = order.engagement_type.value if hasattr(order.engagement_type, 'value') else str(order.engagement_type)

        # Solution Builder XML Structure
        xml = f"""<?xml version="1.0" encoding="UTF-8"?>
<SolutionBuilder version="1.0">
  <Metadata>
    <Name>O2C Orchestrator - {engagement_type} Configuration</Name>
    <Description>Order-to-Cash process with IFRS 15 RAR integration</Description>
    <CreatedDate>{datetime.now().isoformat()}</CreatedDate>
    <Type>O2C_Process</Type>
  </Metadata>

  <Configuration>
    <Order>
      <OrderType>SO</OrderType>
      <EngagementType>{engagement_type}</EngagementType>
      <CustomerSegment>Enterprise</CustomerSegment>
      <Currency>{order.currency}</Currency>
      <RevenueRecognitionMethod>IFRS15_PBO</RevenueRecognitionMethod>
    </Order>

    <RevenueRecognition>
      <Method>{engagement_type}</Method>
      <TaxRate>0.19</TaxRate>
      <CompletionThreshold>25%</CompletionThreshold>
      <Module>RAR</Module>
      <TransactionCode>FARR_IMG</TransactionCode>
      <ConfigObjects>
        <Object>FARR_CONTRACT - Contract master</Object>
        <Object>FARR_D_POSTING - GL account mapping</Object>
        <Object>RAI_CONFIG - Revenue recognition rules</Object>
        <Object>BRFPLUS - % completion logic</Object>
      </ConfigObjects>
    </RevenueRecognition>

    <GLPosting>
"""
        for posting in gl_postings:
            xml += f"""      <Entry>
        <Account>{posting.account}</Account>
        <Type>{posting.type}</Type>
        <Description>{posting.description}</Description>
        <Amount>{posting.amount:.2f}</Amount>
      </Entry>
"""

        xml += f"""    </GLPosting>

    <ARAging>
      <DunningLevel>0</DunningLevel>
      <TransactionCode>F150</TransactionCode>
      <ConfigObjects>
        <Object>FIDT - Dunning procedure master</Object>
        <Object>FI-AR - AR aging setup</Object>
      </ConfigObjects>
      <Levels>
        <Level id="0">Monitor (0-30 days)</Level>
        <Level id="1">Reminder (31-45 days)</Level>
        <Level id="2">Demand + €200 late fee (46-60 days)</Level>
        <Level id="3">Legal Action + €500 late fee (61+ days)</Level>
      </Levels>
    </ARAging>

    <IntegrationPoints>
      <WorkdaySync>
        <Entity>ProjectMaster</Entity>
        <Field>CostCenter</Field>
        <Frequency>Real-time</Frequency>
        <Protocol>OData</Protocol>
      </WorkdaySync>
      <SalesforceSync>
        <Entity>Opportunity</Entity>
        <Field>ContractID</Field>
        <Mapping>Zimit → SO</Mapping>
      </SalesforceSync>
    </IntegrationPoints>

    <TransactionFlow>
      <Step seq="1" txn="VA01">Create Sales Order (SD)</Step>
      <Step seq="2" txn="VA01">Confirm Order (SD)</Step>
      <Step seq="3" txn="VF01">Invoice Generation (FI-AR)</Step>
      <Step seq="4" txn="FARR_IMG">Revenue Recognition (RAR)</Step>
      <Step seq="5" txn="F150">AR Aging & Dunning (FI-AR)</Step>
      <Step seq="6" txn="FB01">GL Posting (FI)</Step>
    </TransactionFlow>

    <ValidationRules>
      <Rule id="1">Order value must be > 0</Rule>
      <Rule id="2">Engagement type must match contract in FARR_CONTRACT</Rule>
      <Rule id="3">Customer must exist in SAP customer master</Rule>
      <Rule id="4">GL accounts must be valid and active</Rule>
      <Rule id="5">Completion % must be 0-100</Rule>
    </ValidationRules>

  </Configuration>

  <Scenarios>
    <Scenario name="T&M">
      <Description>Time & Materials - Monthly over-time recognition</Description>
      <RecognitionBasis>Monthly completion %</RecognitionBasis>
      <BillingFrequency>Monthly</BillingFrequency>
    </Scenario>
    <Scenario name="Fixed Price">
      <Description>Fixed Price - Milestone-based point-in-time</Description>
      <RecognitionBasis>Milestone completion events</RecognitionBasis>
      <BillingFrequency>Per milestone</BillingFrequency>
    </Scenario>
    <Scenario name="Retainer">
      <Description>Retainer - Advance payment with monthly drawdown</Description>
      <RecognitionBasis>Monthly prepayment clearing</RecognitionBasis>
      <BillingFrequency>Monthly drawdown</BillingFrequency>
    </Scenario>
  </Scenarios>

  <DeploymentGuide>
    <Phase1>
      <Task>Run FARR_IMG transaction to configure GL account mapping</Task>
      <Task>Create PBO (Performance Obligation) master records</Task>
      <Task>Configure BRFPLUS rules for revenue recognition logic</Task>
    </Phase1>
    <Phase2>
      <Task>Set up SD order type determination rules</Task>
      <Task>Configure billing plan and invoice layout</Task>
    </Phase2>
    <Phase3>
      <Task>Run dunning procedure configuration (F150)</Task>
      <Task>Set up AR aging periods and escalation rules</Task>
    </Phase3>
    <Phase4>
      <Task>Test E2E flow with sample orders</Task>
      <Task>Validate GL postings and AR aging output</Task>
    </Phase4>
  </DeploymentGuide>

</SolutionBuilder>
"""
        return xml
