import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    
    // محاكاة إنشاء مستخدم جديد
    const newUser = {
      id: Date.now().toString(),
      name: body.name,
      email: body.email,
      role: body.role || 'user',
      permissions: body.permissions || [],
      isActive: body.isActive !== undefined ? body.isActive : true,
      createdAt: new Date().toISOString()
    }
    
    // محاكاة تأخير في المعالجة
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    
    return NextResponse.json({
      success: true,
      user: newUser,
      message: 'تم إنشاء المستخدم بنجاح'
    })
  } catch (error) {
    return NextResponse.json(
      { 
        success: false,
        error: 'خطأ في إنشاء المستخدم' 
      },
      { status: 400 }
    )
  }
} 