"""
Organization and Tenant Seeder
Creates organizations and sets up tenant structure
"""
from datetime import datetime
from app.models import Organization
from .base_seeder import BaseSeeder


class OrganizationSeeder(BaseSeeder):
    """Seeder for organizations"""
    
    def seed(self, tenant_name: str = "Navaia Real Estate") -> str:
        """
        Seed an organization for the tenant
        Returns the organization ID
        """
        # Check if organization already exists for this tenant
        existing = self.db.query(Organization).filter(Organization.tenant_id == self.tenant_id).first()
        if existing:
            self.log(f"⚠️  Organization for tenant '{self.tenant_id}' already exists", "WARN")
            return existing.id
        
        org_id = self.generate_id("org")
        
        organization = Organization(
            id=org_id,
            name=tenant_name,
            tenant_id=self.tenant_id,
            created_at=datetime.utcnow()
        )
        
        self.db.add(organization)
        self.db.commit()
        
        self.log(f"✅ Created Organization: {org_id} ({tenant_name})")
        return org_id
    
    def seed_multiple(self, count: int = 1) -> list:
        """Seed multiple organizations (for multi-tenant setups)"""
        org_ids = []
        tenant_names = [
            "Navaia Real Estate",
            "Al Rajhi Properties", 
            "Riyadh Homes",
            "Saudi Estates Co",
            "Golden Key Realty"
        ]
        
        for i in range(count):
            name = tenant_names[i % len(tenant_names)]
            # For multi-tenant, use different tenant IDs
            tenant_id = f"tenant-{i+1}" if i > 0 else self.tenant_id
            org_id = self.generate_id("org")
            
            organization = Organization(
                id=org_id,
                name=name,
                tenant_id=tenant_id,
                created_at=datetime.utcnow()
            )
            
            self.db.add(organization)
            org_ids.append(org_id)
        
        self.db.commit()
        self.log(f"✅ Created {len(org_ids)} organizations")
        return org_ids


def run_organization_seeder(db, tenant_id: str = "demo-tenant"):
    """Run organization seeder"""
    seeder = OrganizationSeeder(db, tenant_id)
    org_id = seeder.seed()
    return [org_id]
