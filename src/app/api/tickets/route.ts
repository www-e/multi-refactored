import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Fetch from the backend API - only recent 10 tickets
    const response = await fetch('http://127.0.0.1:8000/tickets/recent')
    if (!response.ok) {
      throw new Error('Failed to fetch tickets from backend')
    }
    const tickets = await response.json()
    return NextResponse.json(tickets)
  } catch (error) {
    console.error('Error fetching tickets:', error)
    // Fallback to empty array if backend is not available
    return NextResponse.json([])
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    
    // إنشاء تذكرة جديدة
    const newTicket = {
      id: Date.now().toString(),
      ...body,
      createdAt: new Date().toISOString()
    }
    
    // في التطبيق الحقيقي، سيتم حفظ البيانات في قاعدة البيانات
    console.log('تم إنشاء تذكرة جديدة:', newTicket)
    
    return NextResponse.json(newTicket, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: 'خطأ في معالجة الطلب' },
      { status: 400 }
    )
  }
} 