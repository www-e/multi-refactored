"""
Bulk Call Service Module
Handles bulk calling campaigns with proper concurrency, progress tracking, and error handling
"""

import logging
import secrets
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_

from app import models
from app.services.twilio_service import get_twilio_service

logger = logging.getLogger(__name__)


# ============================================================================
# UTILITY FUNCTIONS
# ============================================================================

def generate_id(prefix: str = "bulk") -> str:
    """Generate unique ID with prefix"""
    return f"{prefix}_{secrets.token_hex(8)}"


def extract_variables_from_script(script_content: str) -> List[str]:
    """
    Extract variable names from script content
    
    Args:
        script_content: Script text with {variable} placeholders
        
    Returns:
        List of unique variable names
    """
    import re
    pattern = r'\{([^}]+)\}'
    matches = re.findall(pattern, script_content)
    return list(set(matches))


# ============================================================================
# SCRIPT MANAGEMENT
# ============================================================================

class BulkCallScriptService:
    """Service for managing bulk call scripts"""
    
    @staticmethod
    def create_script(
        db: Session,
        tenant_id: str,
        name: str,
        content: str,
        agent_type: str,
        description: Optional[str] = None,
        category: str = "general",
        tags: Optional[List[str]] = None,
        created_by: str = "user",
        is_template: bool = False
    ) -> models.BulkCallScript:
        """Create a new bulk call script"""
        script = models.BulkCallScript(
            id=generate_id("script"),
            tenant_id=tenant_id,
            name=name,
            description=description,
            content=content,
            variables=extract_variables_from_script(content),
            agent_type=agent_type,
            category=category,
            tags=tags or [],
            created_by=created_by,
            is_template=is_template
        )
        
        db.add(script)
        db.commit()
        db.refresh(script)
        
        logger.info(f"✅ Created script: {script.id} - {name}")
        return script
    
    @staticmethod
    def get_scripts(
        db: Session,
        tenant_id: str,
        category: Optional[str] = None,
        is_active: bool = True
    ) -> List[models.BulkCallScript]:
        """Get all scripts for tenant"""
        query = db.query(models.BulkCallScript).filter(
            models.BulkCallScript.tenant_id == tenant_id,
            models.BulkCallScript.is_active == is_active
        )
        
        if category:
            query = query.filter(models.BulkCallScript.category == category)
        
        return query.order_by(models.BulkCallScript.created_at.desc()).all()
    
    @staticmethod
    def get_script(db: Session, script_id: str, tenant_id: str) -> Optional[models.BulkCallScript]:
        """Get single script by ID"""
        return db.query(models.BulkCallScript).filter(
            models.BulkCallScript.id == script_id,
            models.BulkCallScript.tenant_id == tenant_id
        ).first()
    
    @staticmethod
    def update_script(
        db: Session,
        script_id: str,
        tenant_id: str,
        **updates
    ) -> Optional[models.BulkCallScript]:
        """Update script"""
        script = BulkCallScriptService.get_script(db, script_id, tenant_id)
        if not script:
            return None
        
        # Update fields
        for key, value in updates.items():
            if hasattr(script, key) and value is not None:
                if key == 'content':
                    # Recalculate variables when content changes
                    script.variables = extract_variables_from_script(value)
                setattr(script, key, value)
        
        script.updated_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(script)
        
        logger.info(f"✅ Updated script: {script_id}")
        return script
    
    @staticmethod
    def delete_script(db: Session, script_id: str, tenant_id: str) -> bool:
        """Soft delete script (set is_active=False)"""
        script = BulkCallScriptService.get_script(db, script_id, tenant_id)
        if not script:
            return False
        
        script.is_active = False
        db.commit()
        
        logger.info(f"✅ Deleted script: {script_id}")
        return True
    
    @staticmethod
    def increment_usage(db: Session, script_id: str):
        """Increment script usage count"""
        script = db.query(models.BulkCallScript).filter_by(id=script_id).first()
        if script:
            script.usage_count += 1
            script.last_used_at = datetime.now(timezone.utc)
            db.commit()


# ============================================================================
# CAMPAIGN MANAGEMENT
# ============================================================================

class BulkCallCampaignService:
    """Service for managing bulk call campaigns"""
    
    @staticmethod
    def create_campaign(
        db: Session,
        tenant_id: str,
        name: str,
        customer_ids: List[str],
        script_content: str,
        agent_type: str = "sales",
        concurrency_limit: int = 3,
        use_knowledge_base: bool = True,
        custom_system_prompt: Optional[str] = None,
        script_id: Optional[str] = None
    ) -> models.BulkCallCampaign:
        """Create a new bulk call campaign"""
        
        # Validate customers exist
        customers = db.query(models.Customer).filter(
            models.Customer.id.in_(customer_ids),
            models.Customer.tenant_id == tenant_id
        ).all()
        
        if len(customers) != len(customer_ids):
            found_ids = {c.id for c in customers}
            missing = set(customer_ids) - found_ids
            logger.warning(f"⚠️ Some customers not found: {missing}")
        
        # Create campaign
        campaign = models.BulkCallCampaign(
            id=generate_id("campaign"),
            tenant_id=tenant_id,
            name=name,
            status=models.BulkCallStatusEnum.queued,
            customer_ids=customer_ids,
            total_calls=len(customers),
            script_content=script_content,
            agent_type=agent_type,
            concurrency_limit=min(max(1, concurrency_limit), 10),  # Clamp between 1-10
            use_knowledge_base=use_knowledge_base,
            custom_system_prompt=custom_system_prompt,
            script_id=script_id
        )
        
        db.add(campaign)
        db.commit()
        db.refresh(campaign)
        
        logger.info(f"✅ Created campaign: {campaign.id} - {name} ({len(customers)} customers)")
        return campaign
    
    @staticmethod
    def get_campaigns(
        db: Session,
        tenant_id: str,
        status: Optional[models.BulkCallStatusEnum] = None
    ) -> List[models.BulkCallCampaign]:
        """Get all campaigns for tenant"""
        query = db.query(models.BulkCallCampaign).filter(
            models.BulkCallCampaign.tenant_id == tenant_id
        )
        
        if status:
            query = query.filter(models.BulkCallCampaign.status == status)
        
        return query.order_by(models.BulkCallCampaign.created_at.desc()).all()
    
    @staticmethod
    def get_campaign(
        db: Session,
        campaign_id: str,
        tenant_id: str
    ) -> Optional[models.BulkCallCampaign]:
        """Get campaign by ID"""
        return db.query(models.BulkCallCampaign).filter(
            models.BulkCallCampaign.id == campaign_id,
            models.BulkCallCampaign.tenant_id == tenant_id
        ).first()
    
    @staticmethod
    def update_campaign_status(
        db: Session,
        campaign_id: str,
        status: models.BulkCallStatusEnum
    ) -> Optional[models.BulkCallCampaign]:
        """Update campaign status"""
        campaign = db.query(models.BulkCallCampaign).filter_by(id=campaign_id).first()
        if not campaign:
            return None
        
        campaign.status = status
        
        if status == models.BulkCallStatusEnum.running and not campaign.started_at:
            campaign.started_at = datetime.now(timezone.utc)
        
        if status in [models.BulkCallStatusEnum.completed, models.BulkCallStatusEnum.failed, models.BulkCallStatusEnum.cancelled]:
            campaign.completed_at = datetime.now(timezone.utc)
        
        db.commit()
        db.refresh(campaign)
        
        logger.info(f"✅ Campaign {campaign_id} status updated to: {status}")
        return campaign
    
    @staticmethod
    def update_campaign_progress(
        db: Session,
        campaign_id: str,
        completed_delta: int = 0,
        failed_delta: int = 0,
        successful_delta: int = 0
    ) -> Optional[models.BulkCallCampaign]:
        """Update campaign progress counters"""
        campaign = db.query(models.BulkCallCampaign).filter_by(id=campaign_id).first()
        if not campaign:
            return None
        
        campaign.completed_calls += completed_delta
        campaign.failed_calls += failed_delta
        campaign.successful_calls += successful_delta
        
        # Check if campaign is complete
        if campaign.completed_calls >= campaign.total_calls:
            campaign.status = models.BulkCallStatusEnum.completed
            campaign.completed_at = datetime.now(timezone.utc)
        
        db.commit()
        db.refresh(campaign)
        
        logger.info(f"✅ Campaign {campaign_id} progress: {campaign.calculate_progress()}%")
        return campaign


# ============================================================================
# CALL RESULT MANAGEMENT
# ============================================================================

class BulkCallResultService:
    """Service for managing bulk call results"""
    
    @staticmethod
    def create_result(
        db: Session,
        campaign_id: str,
        tenant_id: str,
        customer_id: str,
        customer_name: str,
        customer_phone: str
    ) -> models.BulkCallResult:
        """Create a new call result"""
        result = models.BulkCallResult(
            id=generate_id("result"),
            campaign_id=campaign_id,
            tenant_id=tenant_id,
            customer_id=customer_id,
            customer_name=customer_name,
            customer_phone=customer_phone,
            status=models.BulkCallResultStatusEnum.queued
        )
        
        db.add(result)
        db.commit()
        db.refresh(result)
        
        return result
    
    @staticmethod
    def update_result_status(
        db: Session,
        result_id: str,
        status: models.BulkCallResultStatusEnum,
        outcome: Optional[models.BulkCallOutcomeEnum] = None,
        duration_seconds: Optional[int] = None,
        recording_url: Optional[str] = None,
        error_message: Optional[str] = None,
        twilio_call_sid: Optional[str] = None,
        twilio_status: Optional[str] = None
    ) -> Optional[models.BulkCallResult]:
        """Update call result"""
        result = db.query(models.BulkCallResult).filter_by(id=result_id).first()
        if not result:
            return None
        
        # Update fields
        result.status = status
        result.updated_at = datetime.now(timezone.utc)
        
        if outcome:
            result.outcome = outcome
        if duration_seconds is not None:
            result.duration_seconds = duration_seconds
        if recording_url:
            result.recording_url = recording_url
        if error_message:
            result.error_message = error_message
        if twilio_call_sid:
            result.twilio_call_sid = twilio_call_sid
        if twilio_status:
            result.twilio_status = twilio_status
        
        db.commit()
        db.refresh(result)
        
        # Update campaign progress
        if status in [models.BulkCallResultStatusEnum.success, models.BulkCallResultStatusEnum.failed,
                      models.BulkCallResultStatusEnum.voicemail, models.BulkCallResultStatusEnum.no_answer,
                      models.BulkCallResultStatusEnum.busy]:
            BulkCallCampaignService.update_campaign_progress(
                db,
                result.campaign_id,
                completed_delta=1,
                failed_delta=1 if status == models.BulkCallResultStatusEnum.failed else 0,
                successful_delta=1 if status == models.BulkCallResultStatusEnum.success else 0
            )
        
        return result
    
    @staticmethod
    def get_results_for_campaign(
        db: Session,
        campaign_id: str,
        tenant_id: str
    ) -> List[models.BulkCallResult]:
        """Get all results for a campaign"""
        return db.query(models.BulkCallResult).filter(
            models.BulkCallResult.campaign_id == campaign_id,
            models.BulkCallResult.tenant_id == tenant_id
        ).order_by(models.BulkCallResult.created_at.desc()).all()


# ============================================================================
# CAMPAIGN EXECUTION
# ============================================================================

class BulkCallExecutionService:
    """Service for executing bulk call campaigns"""
    
    @staticmethod
    def initialize_campaign_calls(
        db: Session,
        campaign: models.BulkCallCampaign,
        tenant_id: str
    ) -> List[models.BulkCallResult]:
        """Initialize call results for all customers in campaign"""
        
        # Get customers
        customers = db.query(models.Customer).filter(
            models.Customer.id.in_(campaign.customer_ids)
        ).all()
        
        results = []
        for customer in customers:
            result = BulkCallResultService.create_result(
                db=db,
                campaign_id=campaign.id,
                tenant_id=tenant_id,
                customer_id=customer.id,
                customer_name=customer.name,
                customer_phone=customer.phone
            )
            results.append(result)
        
        logger.info(f"✅ Initialized {len(results)} call results for campaign {campaign.id}")
        return results
    
    @staticmethod
    def process_campaign_batch(
        db: Session,
        campaign: models.BulkCallCampaign,
        results: List[models.BulkCallResult],
        webhook_base_url: str
    ) -> Dict[str, Any]:
        """Process a batch of calls for campaign"""
        
        twilio_service = get_twilio_service()
        
        if not twilio_service.is_configured():
            logger.error("❌ Twilio not configured. Cannot make calls.")
            return {
                "success": False,
                "error": "Twilio not configured",
                "processed": 0,
                "failed": len(results)
            }
        
        processed = 0
        failed = 0
        
        for result in results:
            if result.status != models.BulkCallResultStatusEnum.queued:
                continue
            
            try:
                # Create voice session for the call
                session = models.VoiceSession(
                    id=f"vs_{secrets.token_hex(8)}",
                    tenant_id=campaign.tenant_id,
                    customer_id=result.customer_id,
                    direction="outbound",
                    locale="ar-SA",
                    agent_type=campaign.agent_type,
                    status=models.VoiceSessionStatus.ACTIVE
                )
                
                db.add(session)
                db.flush()
                
                # Update result with voice session
                result.voice_session_id = session.id
                result.status = models.BulkCallResultStatusEnum.in_progress
                
                # Initiate Twilio call
                twilio_result = twilio_service.initiate_outbound_call(
                    to_phone=result.customer_phone,
                    session_id=session.id,
                    webhook_url=webhook_base_url,
                    agent_type=campaign.agent_type
                )
                
                # Update result with Twilio SID
                result.twilio_call_sid = twilio_result["call_sid"]
                result.twilio_status = twilio_result["status"]
                
                processed += 1
                
                logger.info(f"✅ Initiated call to {result.customer_phone}: {twilio_result['call_sid']}")
                
            except Exception as e:
                logger.error(f"❌ Failed to initiate call to {result.customer_phone}: {e}")
                
                result.status = models.BulkCallResultStatusEnum.failed
                result.error_message = str(e)
                failed += 1
            
            finally:
                db.commit()
        
        return {
            "success": True,
            "processed": processed,
            "failed": failed
        }
    
    @staticmethod
    def execute_campaign(
        db: Session,
        campaign_id: str,
        tenant_id: str,
        webhook_base_url: str
    ) -> Dict[str, Any]:
        """Execute entire campaign with batch processing"""
        
        campaign = BulkCallCampaignService.get_campaign(db, campaign_id, tenant_id)
        if not campaign:
            return {
                "success": False,
                "error": "Campaign not found"
            }
        
        # Update campaign status to running
        BulkCallCampaignService.update_campaign_status(
            db,
            campaign_id,
            models.BulkCallStatusEnum.running
        )
        
        # Initialize all call results
        all_results = BulkCallExecutionService.initialize_campaign_calls(
            db,
            campaign,
            tenant_id
        )
        
        # Process in batches based on concurrency limit
        batch_size = campaign.concurrency_limit
        total_processed = 0
        total_failed = 0
        
        for i in range(0, len(all_results), batch_size):
            batch = all_results[i:i + batch_size]
            
            logger.info(f"🔄 Processing batch {i // batch_size + 1}/{(len(all_results) + batch_size - 1) // batch_size}")
            
            batch_result = BulkCallExecutionService.process_campaign_batch(
                db,
                campaign,
                batch,
                webhook_base_url
            )
            
            total_processed += batch_result.get("processed", 0)
            total_failed += batch_result.get("failed", 0)
        
        logger.info(f"✅ Campaign execution complete: {total_processed} processed, {total_failed} failed")
        
        return {
            "success": True,
            "campaign_id": campaign_id,
            "total_calls": len(all_results),
            "processed": total_processed,
            "failed": total_failed
        }


# ============================================================================
# SERVICE EXPORTS
# ============================================================================

__all__ = [
    "BulkCallScriptService",
    "BulkCallCampaignService",
    "BulkCallResultService",
    "BulkCallExecutionService",
    "generate_id",
    "extract_variables_from_script",
]
