import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    
    // محاكاة إنشاء تذكرة جديدة
    const newTicket = {
      id: Date.now().toString(),
      category: body.category,
      priority: body.priority,
      description: body.description,
      contact: {
        name: body.contactName,
        phone: body.contactPhone,
        email: body.contactEmail
      },
      propertyId: body.propertyId,
      status: 'مفتوحة',
      assignee: null,
      notes: body.notes,
      createdAt: new Date().toISOString()
    }
    
    // محاكاة تأخير في المعالجة
    await new Promise(resolve => setTimeout(resolve, 800))
    
    
    return NextResponse.json({
      success: true,
      ticket: newTicket,
      message: 'تم إنشاء التذكرة بنجاح'
    })
  } catch (error) {
    return NextResponse.json(
      { 
        success: false,
        error: 'خطأ في إنشاء التذكرة' 
      },
      { status: 400 }
    )
  }
} 