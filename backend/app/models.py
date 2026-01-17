from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, Enum, Boolean, JSON, Text, Float
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import datetime
import enum
from typing import Any
from .db import Base

class ChannelEnum(str, enum.Enum):
    voice = "voice"

class AIOrHumanEnum(str, enum.Enum):
    AI = "AI"
    Human = "Human"

class CallDirectionEnum(str, enum.Enum):
    inbound = "inbound"
    outbound = "outbound"

class CallStatusEnum(str, enum.Enum):
    connected = "connected"
    no_answer = "no_answer"
    abandoned = "abandoned"

class CallOutcomeEnum(str, enum.Enum):
    qualified = "qualified"
    booked = "booked"
    ticket = "ticket"
    info = "info"

class TicketPriorityEnum(str, enum.Enum):
    low = "low"
    med = "med"
    high = "high"
    urgent = "urgent"

class TicketStatusEnum(str, enum.Enum):
    open = "open"
    in_progress = "in_progress"
    resolved = "resolved"

class BookingStatusEnum(str, enum.Enum):
    pending = "pending"
    confirmed = "confirmed"
    canceled = "canceled"
    completed = "completed"

class CampaignTypeEnum(str, enum.Enum):
    voice = "voice"

class VoiceSessionStatus(str, enum.Enum):
    ACTIVE = "active"
    COMPLETED = "completed"
    FAILED = "failed"

class UserRoleEnum(str, enum.Enum):
    user = "user"
    admin = "admin"

# ============================================================================
# BULK CALLING FEATURE - NEW MODELS
# ============================================================================

class BulkCallStatusEnum(str, enum.Enum):
    """Status for bulk call campaigns"""
    queued = "queued"
    running = "running"
    paused = "paused"
    completed = "completed"
    failed = "failed"
    cancelled = "cancelled"

class BulkCallResultStatusEnum(str, enum.Enum):
    """Status for individual bulk call results"""
    queued = "queued"
    in_progress = "in_progress"
    success = "success"
    failed = "failed"
    voicemail = "voicemail"
    no_answer = "no_answer"
    busy = "busy"
    cancelled = "cancelled"

class BulkCallOutcomeEnum(str, enum.Enum):
    """Outcome classification for successful calls"""
    interested = "interested"
    not_interested = "not_interested"
    follow_up_requested = "follow_up_requested"
    appointment_booked = "appointment_booked"
    information_only = "information_only"
    wrong_number = "wrong_number"
    do_not_call = "do_not_call"

class Customer(Base):
    __tablename__ = "customers"
    id: Mapped[str] = mapped_column(String, primary_key=True)
    tenant_id: Mapped[str] = mapped_column(String, index=True, default="demo-tenant")
    name: Mapped[str] = mapped_column(String, index=True, default="Unknown")
    phone: Mapped[str] = mapped_column(String, index=True, nullable=False)
    email: Mapped[str | None] = mapped_column(String, index=True, nullable=True)
    neighborhoods: Mapped[Any | None] = mapped_column(JSON, nullable=True)
    consent: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

class VoiceSession(Base):
    __tablename__ = "voice_sessions"
    id: Mapped[str] = mapped_column(String, primary_key=True)
    tenant_id: Mapped[str] = mapped_column(String, index=True)
    customer_id: Mapped[str | None] = mapped_column(String, ForeignKey("customers.id"), nullable=True)
    direction: Mapped[str] = mapped_column(String, default="inbound")
    status: Mapped[VoiceSessionStatus] = mapped_column(Enum(VoiceSessionStatus), default=VoiceSessionStatus.ACTIVE)
    locale: Mapped[str] = mapped_column(String, default="ar-SA", nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    started_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    ended_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    conversation_id: Mapped[str | None] = mapped_column(String, unique=True, index=True)
    agent_name: Mapped[str | None] = mapped_column(String, nullable=True)
    agent_id: Mapped[str | None] = mapped_column(String, nullable=True)
    customer_phone: Mapped[str | None] = mapped_column(String, nullable=True)
    summary: Mapped[str | None] = mapped_column(Text, nullable=True)
    extracted_intent: Mapped[str | None] = mapped_column(String, nullable=True)
    simulation: Mapped[bool] = mapped_column(Boolean, default=False)

class Ticket(Base):
    __tablename__ = "tickets"
    id: Mapped[str] = mapped_column(String, primary_key=True)
    tenant_id: Mapped[str] = mapped_column(String, index=True)
    customer_id: Mapped[str] = mapped_column(String, ForeignKey("customers.id"), index=True)
    session_id: Mapped[str | None] = mapped_column(String, ForeignKey("voice_sessions.id"), nullable=True)
    priority: Mapped[TicketPriorityEnum] = mapped_column(Enum(TicketPriorityEnum), default=TicketPriorityEnum.med)
    category: Mapped[str] = mapped_column(String, default="General")
    status: Mapped[TicketStatusEnum] = mapped_column(Enum(TicketStatusEnum), default=TicketStatusEnum.open)
    issue: Mapped[str | None] = mapped_column(Text, nullable=True)
    project: Mapped[str | None] = mapped_column(String, nullable=True)
    customer_name: Mapped[str | None] = mapped_column(String, nullable=True)
    phone: Mapped[str | None] = mapped_column(String, nullable=True)
    assignee: Mapped[str | None] = mapped_column(String, nullable=True)
    sla_due_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True) # ✅ Ensure consistency
    resolution_note: Mapped[str | None] = mapped_column(Text, nullable=True)
    approved_by: Mapped[str | None] = mapped_column(String, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

class Booking(Base):
    __tablename__ = "bookings"
    id: Mapped[str] = mapped_column(String, primary_key=True)
    tenant_id: Mapped[str] = mapped_column(String, index=True)
    customer_id: Mapped[str] = mapped_column(String, ForeignKey("customers.id"), index=True)
    session_id: Mapped[str | None] = mapped_column(String, ForeignKey("voice_sessions.id"), nullable=True)
    property_code: Mapped[str] = mapped_column(String, default="GENERAL")
    project: Mapped[str | None] = mapped_column(String, nullable=True)
    start_date: Mapped[datetime] = mapped_column(DateTime)
    preferred_datetime: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    status: Mapped[BookingStatusEnum] = mapped_column(Enum(BookingStatusEnum), default=BookingStatusEnum.pending)
    price_sar: Mapped[float] = mapped_column(Float, default=0.0)
    source: Mapped[ChannelEnum] = mapped_column(Enum(ChannelEnum), default=ChannelEnum.voice)
    created_by: Mapped[AIOrHumanEnum] = mapped_column(Enum(AIOrHumanEnum), default=AIOrHumanEnum.AI)
    customer_name: Mapped[str | None] = mapped_column(String, nullable=True)
    phone: Mapped[str | None] = mapped_column(String, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

class Conversation(Base):
    __tablename__ = "conversations"
    id: Mapped[str] = mapped_column(String, primary_key=True)
    tenant_id: Mapped[str] = mapped_column(String, index=True)
    channel: Mapped[ChannelEnum] = mapped_column(Enum(ChannelEnum), default=ChannelEnum.voice)
    customer_id: Mapped[str] = mapped_column(String, ForeignKey("customers.id"))
    summary: Mapped[str | None] = mapped_column(Text, nullable=True)
    sentiment: Mapped[str | None] = mapped_column(String, nullable=True)
    ai_or_human: Mapped[AIOrHumanEnum] = mapped_column(Enum(AIOrHumanEnum), default=AIOrHumanEnum.AI)
    recording_url: Mapped[str | None] = mapped_column(String, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    ended_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    retention_expires_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

class Call(Base):
    __tablename__ = "calls"
    id: Mapped[str] = mapped_column(String, primary_key=True)
    tenant_id: Mapped[str] = mapped_column(String, index=True)
    conversation_id: Mapped[str] = mapped_column(String, ForeignKey("conversations.id"))
    direction: Mapped[CallDirectionEnum] = mapped_column(Enum(CallDirectionEnum), default=CallDirectionEnum.inbound)
    status: Mapped[CallStatusEnum] = mapped_column(Enum(CallStatusEnum), default=CallStatusEnum.connected)
    handle_sec: Mapped[int | None] = mapped_column(Integer, nullable=True)
    outcome: Mapped[CallOutcomeEnum | None] = mapped_column(Enum(CallOutcomeEnum), default=CallOutcomeEnum.info)
    ai_or_human: Mapped[AIOrHumanEnum] = mapped_column(Enum(AIOrHumanEnum), default=AIOrHumanEnum.AI)
    recording_url: Mapped[str | None] = mapped_column(String, nullable=True)
    retention_expires_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    # ✅ FIXED: The critical missing field
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

class User(Base):
    __tablename__ = "users"
    id: Mapped[str] = mapped_column(String, primary_key=True)
    email: Mapped[str] = mapped_column(String, unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String)
    name: Mapped[str] = mapped_column(String)
    role: Mapped[UserRoleEnum] = mapped_column(Enum(UserRoleEnum), default=UserRoleEnum.user)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    tenant_id: Mapped[str] = mapped_column(String, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    last_login_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

class Campaign(Base):
    __tablename__ = "campaigns"
    id: Mapped[str] = mapped_column(String, primary_key=True)
    tenant_id: Mapped[str] = mapped_column(String, index=True)
    name: Mapped[str] = mapped_column(String)
    type: Mapped[CampaignTypeEnum] = mapped_column(Enum(CampaignTypeEnum))
    objective: Mapped[str] = mapped_column(String)
    status: Mapped[str] = mapped_column(String, default="active")
    audience_query: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    schedule: Mapped[dict | None] = mapped_column(JSON, nullable=True) # ✅ Added back to match alembic
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

class CampaignMetrics(Base):
    __tablename__ = "campaign_metrics"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    campaign_id: Mapped[str] = mapped_column(String, ForeignKey("campaigns.id"))
    tenant_id: Mapped[str] = mapped_column(String, index=True)
    ts: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    reached: Mapped[int] = mapped_column(Integer, default=0)
    engaged: Mapped[int] = mapped_column(Integer, default=0)
    qualified: Mapped[int] = mapped_column(Integer, default=0)
    booked: Mapped[int] = mapped_column(Integer, default=0)
    revenue_sar: Mapped[float] = mapped_column(Float, default=0.0)
    roas: Mapped[float] = mapped_column(Float, default=0.0)

# Supporting tables for consistency
class Event(Base):
    __tablename__ = "events"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    type: Mapped[str] = mapped_column(String, nullable=False)
    payload: Mapped[dict] = mapped_column(JSON, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    tenant_id: Mapped[str] = mapped_column(String, nullable=False, index=True)

class Handoff(Base):
    __tablename__ = "handoffs"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    conversation_id: Mapped[str] = mapped_column(String, ForeignKey("conversations.id"), nullable=False)
    from_tier: Mapped[str] = mapped_column(String, nullable=False)
    to_tier: Mapped[str] = mapped_column(String, nullable=False)
    reason: Mapped[str] = mapped_column(String, nullable=False)
    at: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    success: Mapped[bool] = mapped_column(Boolean, nullable=False)
    tenant_id: Mapped[str | None] = mapped_column(String, nullable=True, index=True)

class Approval(Base):
    __tablename__ = "approvals"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    entity_type: Mapped[str] = mapped_column(String, nullable=False)
    entity_id: Mapped[str] = mapped_column(String, nullable=False)
    approver: Mapped[str] = mapped_column(String, nullable=False)
    status: Mapped[str] = mapped_column(String, nullable=False)
    at: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    tenant_id: Mapped[str | None] = mapped_column(String, nullable=True, index=True)

class Organization(Base):
    __tablename__ = "organizations"
    id: Mapped[str] = mapped_column(String, primary_key=True)
    name: Mapped[str] = mapped_column(String, nullable=False)
    tenant_id: Mapped[str] = mapped_column(String, unique=True, index=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False)

# ============================================================================
# BULK CALLING FEATURE - DATABASE MODELS
# ============================================================================

class BulkCallScript(Base):
    """Reusable scripts for bulk calling campaigns"""
    __tablename__ = "bulk_call_scripts"
    
    id: Mapped[str] = mapped_column(String, primary_key=True)
    tenant_id: Mapped[str] = mapped_column(String, index=True, nullable=False)
    
    # Script details
    name: Mapped[str] = mapped_column(String, nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    
    # Script configuration
    variables: Mapped[dict | None] = mapped_column(JSON, nullable=True)  # List of variable names
    agent_type: Mapped[str] = mapped_column(String, nullable=False)  # 'sales' or 'support'
    
    # Categorization
    category: Mapped[str] = mapped_column(String, default="general")  # marketing, support, renewal, general, custom
    tags: Mapped[dict | None] = mapped_column(JSON, nullable=True)  # List of tags
    
    # Usage tracking
    usage_count: Mapped[int] = mapped_column(Integer, default=0)
    last_used_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    
    # Metadata
    created_by: Mapped[str] = mapped_column(String, nullable=False)
    is_template: Mapped[bool] = mapped_column(Boolean, default=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    
    # Timestamps
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class BulkCallCampaign(Base):
    """Bulk call campaign tracking"""
    __tablename__ = "bulk_call_campaigns"
    
    id: Mapped[str] = mapped_column(String, primary_key=True)
    tenant_id: Mapped[str] = mapped_column(String, index=True, nullable=False)
    
    # Campaign details
    name: Mapped[str] = mapped_column(String, nullable=False)
    status: Mapped[BulkCallStatusEnum] = mapped_column(Enum(BulkCallStatusEnum), default=BulkCallStatusEnum.queued)
    
    # Customer targeting
    customer_ids: Mapped[dict] = mapped_column(JSON, nullable=False)  # List of customer IDs
    total_calls: Mapped[int] = mapped_column(Integer, nullable=False)
    
    # Progress tracking
    completed_calls: Mapped[int] = mapped_column(Integer, default=0)
    failed_calls: Mapped[int] = mapped_column(Integer, default=0)
    successful_calls: Mapped[int] = mapped_column(Integer, default=0)
    
    # Script configuration
    script_id: Mapped[str | None] = mapped_column(String, ForeignKey("bulk_call_scripts.id"), nullable=True)
    script_content: Mapped[str] = mapped_column(Text, nullable=False)
    
    # Agent configuration
    agent_type: Mapped[str] = mapped_column(String, nullable=False)  # 'sales' or 'support'
    concurrency_limit: Mapped[int] = mapped_column(Integer, default=3)
    
    # Knowledge base and AI configuration
    use_knowledge_base: Mapped[bool] = mapped_column(Boolean, default=True)
    custom_system_prompt: Mapped[str | None] = mapped_column(Text, nullable=True)
    
    # Timestamps
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    started_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    
    # Relationships
    script: Mapped["BulkCallScript"] = relationship("BulkCallScript", backref="campaigns")
    
    def calculate_progress(self) -> float:
        """Calculate campaign progress percentage"""
        if self.total_calls == 0:
            return 0.0
        return round((self.completed_calls / self.total_calls) * 100, 2)

class BulkCallResult(Base):
    """Individual call results for bulk campaigns"""
    __tablename__ = "bulk_call_results"
    
    id: Mapped[str] = mapped_column(String, primary_key=True)
    campaign_id: Mapped[str] = mapped_column(String, ForeignKey("bulk_call_campaigns.id"), nullable=False)
    tenant_id: Mapped[str] = mapped_column(String, index=True, nullable=False)
    
    # Call reference
    call_id: Mapped[str] = mapped_column(String, ForeignKey("calls.id"), nullable=True)
    conversation_id: Mapped[str] = mapped_column(String, ForeignKey("conversations.id"), nullable=True)
    
    # Customer information (denormalized for performance)
    customer_id: Mapped[str] = mapped_column(String, ForeignKey("customers.id"), nullable=False)
    customer_name: Mapped[str] = mapped_column(String, nullable=False)
    customer_phone: Mapped[str] = mapped_column(String, nullable=False)
    
    # Call status and outcome
    status: Mapped[BulkCallResultStatusEnum] = mapped_column(
        Enum(BulkCallResultStatusEnum), 
        default=BulkCallResultStatusEnum.queued,
        nullable=False
    )
    outcome: Mapped[BulkCallOutcomeEnum | None] = mapped_column(Enum(BulkCallOutcomeEnum), nullable=True)
    
    # Call details
    duration_seconds: Mapped[int | None] = mapped_column(Integer, nullable=True)
    recording_url: Mapped[str | None] = mapped_column(String, nullable=True)
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)
    
    # Twilio integration
    twilio_call_sid: Mapped[str | None] = mapped_column(String, nullable=True)
    twilio_status: Mapped[str | None] = mapped_column(String, nullable=True)
    
    # AI session reference
    voice_session_id: Mapped[str | None] = mapped_column(String, ForeignKey("voice_sessions.id"), nullable=True)
    
    # Timestamps
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    campaign: Mapped["BulkCallCampaign"] = relationship("BulkCallCampaign", backref="results")
    call: Mapped["Call"] = relationship("Call", backref="bulk_result")
    customer: Mapped["Customer"] = relationship("Customer", backref="bulk_call_results")
    conversation: Mapped["Conversation"] = relationship("Conversation", backref="bulk_results")
    voice_session: Mapped["VoiceSession"] = relationship("VoiceSession", backref="bulk_results")

