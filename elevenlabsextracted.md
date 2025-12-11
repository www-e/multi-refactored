Summary

Omar, a resident of Saqifa 28, reported an electrical issue and requested maintenance at 4 PM, providing his phone number. Khaled, the customer service representative, confirmed the appointment and offered further assistance. Omar had no further requests, and the call was ended.

Call status

Successful
How the call ended

Agent ended call

User ID

No user ID

Data collection

preferred_datetime

string
2025-12-11T16:00:00+03:00

The user requested an appointment for "بكر الساعة اربعة" which translates to "tomorrow at four o'clock". Since the conversation started at 2025-12-10T17:54:50+00:00, "tomorrow" would be 2025-12-11. The time is 4 PM, so the ISO 8601 format would be 2025-12-11T16:00:00+03:00, assuming Riyadh time.

phone

string
01154688628

The user states their phone number as 'صفر واحد واحد خمسة اربعة ستة تمانية تمانية ستة اتنين تمانية' which translates to 01154688628. I have extracted this number.

extracted_intent

string
raise_ticket

The user is reporting an issue with their electricity and requesting someone to fix it. This falls under the category of raising a ticket for support.

customer_name

string
عمر

The user states his name as 'عمر' (Omar) in the second turn of the conversation.

issue

string
مشكلة في الكهرباء

The user reported a problem with electricity and requested maintenance. Therefore, the intent is to raise a ticket. The problem statement in Arabic is extracted as 'مشكلة في الكهرباء'.

priority

string
high

The user reported a problem with electricity, which is considered urgent. Therefore, the priority should be classified as 'high'.

project

string
سقيفة 28

The user mentions "سقيفة تمانية وعشرين" (Sqifa 28) as the location where they live and where the maintenance is needed. The agent also confirms this location in its response.
-------------------------------------------------------------------------------------------------------------------------------

M7senNew subagent

هلا حياك الله, معك خالد, ممثل خدمة العملاء في سَقيفَة, تفضل كيف اقدر اخدمك

0:00
TTS
230 ms
هلا خالد انا عمر ساكن في سقيفة تمانية وعشرين وعندي مشكلة في الكهرباء. عايز حد يجي يحلى لي بكر الساعة اربعة. رقم تليفوني هو صفر واحد واحد خمسة اربعة ستة تمانية تمانية ستة اتنين تمانية. مفيش اي معلومات اضافية تانية اقدر اضيفها.

0:06
ASR
199 ms


M7senNew subagent

أَبْشِرْ يا عمر، سأقوم بترتيب موعد لصيانة الكهرباء في مشروع سقيفة ثمانية وعشرين غداً الساعة الرابعة. إذا كان هناك أي شيء آخر تحتاجه، لا تتردد في إخباري.

0:27
LLM
1.6 s
TTS
269 ms
لا مفيش حاجة تانية تقدر تقفل او حاجة

0:40
ASR
227 ms


M7senNew subagent

شكرًا لاتصالك يا عمر، ونتمنى لك يوم سعيد. في أمان الله.

0:45
TTS
192 ms
Agent ended the call

The user has confirmed that they have no further requests and the main task o...
Show more
--------------------------------------------------------------------------------------------------------------------------------
Data collection

Add data point

preferred_datetime

If intent is book_appointment, extract the requested date/time in ISO 8601 if explicitly stated (e.g., 2025-09-10T16:00:00+03:00). If relative (غداً العصر)، normalize to a best-guess ISO in Riyadh time if clear; otherwise leave empty.



phone

Extract the caller's phone number from the conversation if stated. Use digits only (e.g., 0501234567 or 9665XXXXXXXX). If not stated, leave empty.



extracted_intent

Classify the user's request for the whole conversation into exactly one of: - raise_ticket (customer has a complaint, issue, or needs support) - book_appointment (customer wants to schedule a visit, viewing, meeting, or confirm an existing one) - none (no actionable request) Output only one of: raise_ticket | book_appointment | none.



customer_name

Extract the caller's name if stated (Arabic preferred). If not stated, leave empty.



issue

If intent is raise_ticket, extract a concise problem statement in Arabic (≤200 chars), e.g., "عطل في التكييف"، "تاخير في الصيانة". Otherwise leave empty.



priority

If intent is raise_ticket, classify priority as one of: low | medium | high based on urgency (مثلاً انقطاع كهرباء = high). Otherwise leave empty.



project

Extract the project or location mentioned (e.g., "سقيفة 28"، "القيروان"، "المعذر"). If none mentioned, leave empty.