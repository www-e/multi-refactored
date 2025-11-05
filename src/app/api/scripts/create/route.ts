import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    
    // محاكاة إنشاء برنامج نصي جديد
    const newScript = {
      id: Date.now().toString(),
      name: body.name,
      intent: body.intent,
      userPhrases: body.userPhrases || [],
      agentResponses: body.agentResponses || [],
      actions: body.actions || [],
      isActive: body.isActive !== undefined ? body.isActive : true,
      createdAt: new Date().toISOString()
    }
    
    // محاكاة تأخير في المعالجة
    await new Promise(resolve => setTimeout(resolve, 800))
    
    
    return NextResponse.json({
      success: true,
      script: newScript,
      message: 'تم إنشاء البرنامج النصي بنجاح'
    })
  } catch (error) {
    return NextResponse.json(
      { 
        success: false,
        error: 'خطأ في إنشاء البرنامج النصي' 
      },
      { status: 400 }
    )
  }
} 