import { Account } from "@/lib/types";

export const chartOfAccounts: Account[] = [
    {
        id: "1",
        code: "1000",
        name: "الأصول",
        nameEn: "Assets",
        type: "asset",
        isPostable: false,
        level: 1,
        parentId: null,
        children: [
            {
                id: "1.1",
                code: "1100",
                name: "الأصول المتداولة",
                nameEn: "Current Assets",
                type: "asset",
                isPostable: false,
                level: 2,
                parentId: "1",
                children: [
                    { id: "1.1.1", code: "1110", name: "النقدية وما في حكمها", nameEn: "Cash & Equivalents", type: "asset", isPostable: true, level: 3, parentId: "1.1", balance: 50000 },
                    { id: "1.1.2", code: "1120", name: "البنوك", nameEn: "Bank Accounts", type: "asset", isPostable: true, level: 3, parentId: "1.1", balance: 125000 },
                    { id: "1.1.3", code: "1130", name: "حسابات العملاء", nameEn: "Accounts Receivable", type: "asset", isPostable: true, level: 3, parentId: "1.1", balance: 75000 },
                    { id: "1.1.4", code: "1140", name: "المخزون", nameEn: "Inventory", type: "asset", isPostable: true, level: 3, parentId: "1.1", balance: 30000 },
                ]
            },
            {
                id: "1.2",
                code: "1200",
                name: "الأصول الثابتة",
                nameEn: "Fixed Assets",
                type: "asset",
                isPostable: false,
                level: 2,
                parentId: "1",
                children: [
                    { id: "1.2.1", code: "1210", name: "المعدات والأدوات", nameEn: "Equipment", type: "asset", isPostable: true, level: 3, parentId: "1.2", balance: 20000 },
                    { id: "1.2.2", code: "1220", name: "السيارات ووسائل النقل", nameEn: "Vehicles", type: "asset", isPostable: true, level: 3, parentId: "1.2", balance: 150000 },
                ]
            }
        ]
    },
    {
        id: "2",
        code: "2000",
        name: "الخصوم",
        nameEn: "Liabilities",
        type: "liability",
        isPostable: false,
        level: 1,
        parentId: null,
        children: [
            {
                id: "2.1",
                code: "2100",
                name: "الالتزامات المتداولة",
                nameEn: "Current Liabilities",
                type: "liability",
                isPostable: false,
                level: 2,
                parentId: "2",
                children: [
                    { id: "2.1.1", code: "2110", name: "حسابات الموردين", nameEn: "Accounts Payable", type: "liability", isPostable: true, level: 3, parentId: "2.1", balance: 45000 },
                    { id: "2.1.2", code: "2120", name: "الرواتب المستحقة", nameEn: "Accrued Salaries", type: "liability", isPostable: true, level: 3, parentId: "2.1", balance: 15000 },
                ]
            }
        ]
    },
    {
        id: "3",
        code: "3000",
        name: "حقوق الملكية",
        nameEn: "Equity",
        type: "equity",
        isPostable: false,
        level: 1,
        parentId: null,
        children: [
            { id: "3.1", code: "3100", name: "رأس المال", nameEn: "Capital", type: "equity", isPostable: true, level: 2, parentId: "3", balance: 300000 },
            { id: "3.2", code: "3200", name: "الأرباح المحتجزة", nameEn: "Retained Earnings", type: "equity", isPostable: true, level: 2, parentId: "3", balance: 50000 },
        ]
    },
    {
        id: "4",
        code: "4000",
        name: "الإيرادات",
        nameEn: "Revenue",
        type: "revenue",
        isPostable: false,
        level: 1,
        parentId: null,
        children: [
            { id: "4.1", code: "4100", name: "مبيعات الخدمات", nameEn: "Service Sales", type: "revenue", isPostable: true, level: 2, parentId: "4", balance: 250000 },
            { id: "4.2", code: "4200", name: "إيرادات العمولات", nameEn: "Commission Income", type: "revenue", isPostable: true, level: 2, parentId: "4", balance: 15000 },
        ]
    },
    {
        id: "5",
        code: "5000",
        name: "المصروفات",
        nameEn: "Expenses",
        type: "expense",
        isPostable: false,
        level: 1,
        parentId: null,
        children: [
            {
                id: "5.1",
                code: "5100",
                name: "مصاريف تشغيلية",
                nameEn: "Operating Expenses",
                type: "expense",
                isPostable: false,
                level: 2,
                parentId: "5",
                children: [
                    { id: "5.1.1", code: "5110", name: "رواتب وأجور", nameEn: "Salaries & Wages", type: "expense", isPostable: true, level: 3, parentId: "5.1", balance: 80000 },
                    { id: "5.1.2", code: "5120", name: "إيجارات", nameEn: "Rent", type: "expense", isPostable: true, level: 3, parentId: "5.1", balance: 25000 },
                    { id: "5.1.3", code: "5130", name: "كهرباء ومياه", nameEn: "Utilities", type: "expense", isPostable: true, level: 3, parentId: "5.1", balance: 5000 },
                ]
            },
            {
                id: "5.2",
                code: "5200",
                name: "مصاريف تسويقية",
                nameEn: "Marketing Expenses",
                type: "expense",
                isPostable: true,
                level: 2,
                parentId: "5",
                balance: 12000
            }
        ]
    }
];
