"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Form } from "@/components/ui/form"
import { FormSelect, SelectOption } from "@/components/ui/form/form-select"
import { zodResolver } from "@hookform/resolvers/zod"
import { DollarSign, Globe, Package, Tag, Users, Loader2 } from "lucide-react"
import { useState } from "react"
import { useForm } from "react-hook-form"
import * as z from "zod"

const schema = z.object({
  currency: z.string().min(1, "الرجاء اختيار العملة"),
  country: z.string().min(1, "الرجاء اختيار الدولة"),
  product: z.coerce.number().min(1, "الرجاء اختيار المنتج"),
  categories: z.array(z.string()).min(1, "اختر تصنيف واحد على الأقل"),
  tags: z.array(z.string()).min(1, "أضف وسماً واحداً على الأقل"),
  asyncUser: z.string().min(1, "اختر مستخدم"),
  team: z.array(z.number()).min(2, "اختر عضوين على الأقل"),
})

type FormValues = z.infer<typeof schema>

const currencies: SelectOption[] = [
  { value: "USD", label: "دولار أمريكي ($)", icon: <DollarSign className="h-4 w-4 text-green-500" /> },
  { value: "SAR", label: "ريال سعودي (ريال)", icon: <span className="text-xs font-bold text-yellow-600">ر</span> },
  { value: "SDG", label: "جنيه سوداني (ج.س)", icon: <span className="text-xs font-bold text-blue-600">ج</span> },
  { value: "EUR", label: "يورو (€)", icon: <span className="text-xs font-bold text-indigo-600">€</span> },
  { value: "GBP", label: "جنيه إسترليني (£)", icon: <span className="text-xs font-bold text-purple-600">£</span> },
  { value: "AED", label: "درهم إماراتي (د.إ)", icon: <span className="text-xs font-bold text-red-600">د</span> },
  { value: "KWD", label: "دينار كويتي (د.ك)", icon: <span className="text-xs font-bold text-orange-600">د</span> },
  { value: "QAR", label: "ريال قطري (ر.ق)", icon: <span className="text-xs font-bold text-teal-600">ر</span> },
]

const countries: SelectOption[] = [
  { value: "SA", label: "المملكة العربية السعودية", icon: <Globe className="h-4 w-4" /> },
  { value: "SD", label: "السودان", icon: <Globe className="h-4 w-4" /> },
  { value: "AE", label: "الإمارات العربية المتحدة", icon: <Globe className="h-4 w-4" /> },
  { value: "EG", label: "مصر", icon: <Globe className="h-4 w-4" /> },
  { value: "JO", label: "الأردن", icon: <Globe className="h-4 w-4" /> },
  { value: "KW", label: "الكويت", icon: <Globe className="h-4 w-4" /> },
  { value: "QA", label: "قطر", icon: <Globe className="h-4 w-4" /> },
  { value: "BH", label: "البحرين", icon: <Globe className="h-4 w-4" /> },
  { value: "OM", label: "سلطنة عُمان", icon: <Globe className="h-4 w-4" /> },
]

const products: SelectOption[] = [
  { value: 1, label: "لابتوب Dell XPS 15", icon: <Package className="h-4 w-4 text-blue-500" /> },
  { value: 2, label: "iPhone 15 Pro Max", icon: <Package className="h-4 w-4 text-gray-500" /> },
  { value: 3, label: "سماعات Sony WH-1000XM5", icon: <Package className="h-4 w-4 text-red-500" /> },
  { value: 4, label: "شاشة Samsung 32\"", icon: <Package className="h-4 w-4 text-green-500" /> },
  { value: 5, label: "كيبورد Logitech MX Keys", icon: <Package className="h-4 w-4 text-yellow-500" /> },
]

const categories: SelectOption[] = [
  { value: "electronics", label: "إلكترونيات" },
  { value: "clothing", label: "ملابس" },
  { value: "food", label: "مواد غذائية" },
  { value: "books", label: "كتب" },
  { value: "furniture", label: "أثاث" },
  { value: "toys", label: "ألعاب" },
]

const teamMembers: SelectOption[] = [
  { value: 1, label: "أحمد محمد", icon: <Users className="h-4 w-4 text-blue-500" /> },
  { value: 2, label: "خالد عمر", icon: <Users className="h-4 w-4 text-green-500" /> },
  { value: 3, label: "سارة علي", icon: <Users className="h-4 w-4 text-pink-500" /> },
  { value: 4, label: "فاطمة حسن", icon: <Users className="h-4 w-4 text-purple-500" /> },
  { value: 5, label: "محمود إبراهيم", icon: <Users className="h-4 w-4 text-orange-500" /> },
]

const mockUsers: SelectOption[] = [
  { value: "user1", label: "محمد أحمد - mohamed@example.com" },
  { value: "user2", label: "سارة خالد - sara@example.com" },
  { value: "user3", label: "عمر علي - omar@example.com" },
  { value: "user4", label: "فاطمة حسن - fatima@example.com" },
  { value: "user5", label: "أحمد محمود - ahmed@example.com" },
  { value: "user6", label: "نورة عبدالله - nora@example.com" },
  { value: "user7", label: "خالد سعيد - khaled@example.com" },
  { value: "user8", label: "ليلى إبراهيم - laila@example.com" },
]

const loadUsersAsync = (inputValue: string): Promise<SelectOption[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const filtered = mockUsers.filter((user) =>
        user.label.toLowerCase().includes(inputValue.toLowerCase())
      )
      resolve(filtered)
    }, 500)
  })
}

export default function TestSelectPage() {
  const [submitted, setSubmitted] = useState<FormValues | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      currency: "",
      country: "",
      product: 0,
      categories: [],
      tags: [],
      asyncUser: "",
      team: [],
    },
  })

  const onSubmit = async (data: FormValues) => {
    setIsLoading(true)
    await new Promise((resolve) => setTimeout(resolve, 1000))
    setSubmitted(data)
    setIsLoading(false)
  }

  return (
    <div className="min-h-screen bg-muted/30 p-8" dir="rtl">
      <div className="mx-auto max-w-3xl space-y-6">

        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">🧪 اختبار مكون FormSelect</h1>
          <p className="text-muted-foreground">
            اختبار جميع أنواع الاختيار: Single, Multi, Async, Creatable
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Badge variant="secondary">1</Badge>
                  اختيار منفرد (Single Select) + أيقونات
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormSelect
                  control={form.control}
                  name="currency"
                  label="العملة"
                  placeholder="اختر العملة..."
                  options={currencies}
                  isClearable
                />
                <FormSelect
                  control={form.control}
                  name="country"
                  label="الدولة"
                  placeholder="اختر الدولة..."
                  options={countries}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Badge variant="secondary">2</Badge>
                  قيم رقمية (Numeric Values)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <FormSelect
                  control={form.control}
                  name="product"
                  label="المنتج"
                  placeholder="اختر المنتج..."
                  options={products}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Badge variant="secondary">3</Badge>
                  اختيار متعدد (Multi Select)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <FormSelect
                  control={form.control}
                  name="categories"
                  label="التصنيفات"
                  placeholder="اختر التصنيفات..."
                  options={categories}
                  isMulti
                  closeMenuOnSelect={false}
                  hideSelectedOptions={false}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Badge variant="secondary">4</Badge>
                  فريق العمل - Multi + أيقونات
                </CardTitle>
              </CardHeader>
              <CardContent>
                <FormSelect
                  control={form.control}
                  name="team"
                  label="أعضاء الفريق"
                  placeholder="اختر أعضاء الفريق..."
                  options={teamMembers}
                  isMulti
                  closeMenuOnSelect={false}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Badge variant="secondary">5</Badge>
                  تحميل غير متزامن (Async Select)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <FormSelect
                  control={form.control}
                  name="asyncUser"
                  label="المستخدم (Async)"
                  placeholder="ابحث عن مستخدم..."
                  options={[]}
                  isAsync
                  loadOptions={loadUsersAsync}
                  defaultOptions={mockUsers.slice(0, 4)}
                  cacheOptions
                  loadingMessage="جاري البحث..."
                  noOptionsMessage="لا يوجد مستخدمون مطابقون"
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Badge variant="secondary">6</Badge>
                  إنشاء وسوم (Creatable/Tags)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <FormSelect
                  control={form.control}
                  name="tags"
                  label="الوسوم"
                  placeholder="أضف وسماً أو اختر..."
                  options={[
                    { value: "عاجل", label: "عاجل", icon: <Tag className="h-4 w-4 text-red-500" /> },
                    { value: "مهم", label: "مهم", icon: <Tag className="h-4 w-4 text-yellow-500" /> },
                    { value: "مكتمل", label: "مكتمل", icon: <Tag className="h-4 w-4 text-green-500" /> },
                    { value: "معلق", label: "معلق", icon: <Tag className="h-4 w-4 text-blue-500" /> },
                  ]}
                  isMulti
                  isCreatable
                  formatCreateLabel={(input) => `إنشاء وسم جديد: "${input}"`}
                  closeMenuOnSelect={false}
                />
              </CardContent>
            </Card>

            <Button
              type="submit"
              className="w-full"
              size="lg"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  جاري الإرسال...
                </>
              ) : (
                "إرسال واختبار القيم"
              )}
            </Button>
          </form>
        </Form>

        {submitted && (
          <Card className="border-green-500 bg-green-50 dark:bg-green-950/20">
            <CardHeader>
              <CardTitle className="text-green-700 dark:text-green-400 text-base">
                ✅ تم الإرسال بنجاح!
              </CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="text-sm bg-background rounded p-3 overflow-auto">
                {JSON.stringify(submitted, null, 2)}
              </pre>
            </CardContent>
          </Card>
        )}

        {Object.keys(form.formState.errors).length > 0 && (
          <Card className="border-red-500 bg-red-50 dark:bg-red-950/20">
            <CardHeader>
              <CardTitle className="text-red-700 dark:text-red-400 text-base">❌ أخطاء التحقق</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="text-sm bg-background rounded p-3 overflow-auto">
                {JSON.stringify(form.formState.errors, null, 2)}
              </pre>
            </CardContent>
          </Card>
        )}

      </div>
    </div>
  )
}
