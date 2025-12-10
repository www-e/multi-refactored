from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, Enum, Boolean, JSON, Text, Float
from sqlalchemy.orm import Mapped, mapped_column
from datetime import datetime
import enum
from typing import Any
from .db import Base

class ChannelEnum(str, enum.Enum):
    voice = "voice"
    chat = "chat"

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
    pending_approval = "pending_approval"
    resolved = "resolved"

class BookingStatusEnum(str, enum.Enum):
    pending = "pending"
    confirmed = "confirmed"
    canceled = "canceled"
    completed = "completed"

class CampaignTypeEnum(str, enum.Enum):
    voice = "voice"
    chat = "chat"

class VoiceSessionStatus(str, enum.Enum):
    ACTIVE = "active"
    COMPLETED = "completed"
    FAILED = "failed"

class UserRoleEnum(str, enum.Enum):
    user = "user"
    admin = "admin"

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

class Message(Base):
    __tablename__ = "messages"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    conversation_id: Mapped[str] = mapped_column(String, ForeignKey("conversations.id"), nullable=False, index=True)
    role: Mapped[str] = mapped_column(String, nullable=False, index=True)
    text: Mapped[str] = mapped_column(Text, nullable=False)
    ts: Mapped[datetime] = mapped_column(DateTime, nullable=False, index=True)