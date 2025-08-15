"use client";
import React, { useState, useEffect, useCallback } from "react";
import { format, subDays, startOfMonth, endOfDay } from "date-fns";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Download } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchFromHasura } from "@/lib/hasuraClient";
import { Partner, useAuthStore } from "@/store/authStore";
import * as XLSX from 'xlsx-js-style'

// Helper function to format date as YYYY-MM-DD
const formatDate = (date: Date) => format(date, "yyyy-MM-dd");

const OrderReport = () => {
  const { userData } = useAuthStore();
  const [dateRange, setDateRange] = useState({
    startDate: subDays(new Date(), 7),
    endDate: new Date(),
  });
  const [activeTab, setActiveTab] = useState<"today" | "month" | "custom">(
    "today"
  );
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // GraphQL queries with partner-specific filters
  const TODAY_ORDERS_QUERY = (today: string) => `
    query TodayOrders {
      orders_aggregate(where: {created_at: {_gte: "${today}T00:00:00Z"}, status: {_eq: "completed"}, partner_id: {_eq: "${userData?.id}"}}) {
        aggregate {
          sum {
            total_price
          }
          count
        }
      }
      delivery_orders: orders_aggregate(where: {created_at: {_gte: "${today}T00:00:00Z"}, status: {_eq: "completed"}, type: {_eq: "delivery"}, partner_id: {_eq: "${userData?.id}"}}) {
        aggregate {
          count
        }
      }
      top_items: order_items(where: {order: {created_at: {_gte: "${today}T00:00:00Z"}, status: {_eq: "completed"}, partner_id: {_eq: "${userData?.id}"}}}, limit: 5, order_by: {quantity: desc}) {
        menu {
          name
          category {
            name
          }
        }
        quantity
      }
      daily_sales: orders_aggregate(
        where: {created_at: {_gte: "${today}T00:00:00Z"}, status: {_eq: "completed"}, partner_id: {_eq: "${userData?.id}"}}
        order_by: {created_at: asc}
      ) {
        nodes {
          total_price
          created_at
        }
      }
      category_stats: order_items(
        where: {order: {created_at: {_gte: "${today}T00:00:00Z"}, status: {_eq: "completed"}, partner_id: {_eq: "${userData?.id}"}}}
      ) {
        menu {
          category {
            name
          }
          price
        }
        quantity
      }
    }
  `;

  const MONTHLY_ORDERS_QUERY = (startOfMonthDate: string, today: string) => `
    query MonthlyOrders {
      orders_aggregate(where: {created_at: {_gte: "${startOfMonthDate}T00:00:00Z", _lte: "${today}T23:59:59Z"}, status: {_eq: "completed"}, partner_id: {_eq: "${userData?.id}"}}) {
        aggregate {
          sum {
            total_price
          }
          count
        }
      }
      delivery_orders: orders_aggregate(where: {created_at: {_gte: "${startOfMonthDate}T00:00:00Z", _lte: "${today}T23:59:59Z"}, status: {_eq: "completed"}, type: {_eq: "delivery"}, partner_id: {_eq: "${userData?.id}"}}) {
        aggregate {
          count
        }
      }
      top_items: order_items(where: {order: {created_at: {_gte: "${startOfMonthDate}T00:00:00Z", _lte: "${today}T23:59:59Z"}, status: {_eq: "completed"}, partner_id: {_eq: "${userData?.id}"}}}, limit: 5, order_by: {quantity: desc}) {
        menu {
          name
          category {
            name
          }
        }
        quantity
      }
      daily_sales: orders_aggregate(
        where: {created_at: {_gte: "${startOfMonthDate}T00:00:00Z", _lte: "${today}T23:59:59Z"}, status: {_eq: "completed"}, partner_id: {_eq: "${userData?.id}"}}
        order_by: {created_at: asc}
      ) {
        nodes {
          total_price
          created_at
        }
      }
      category_stats: order_items(
        where: {order: {created_at: {_gte: "${startOfMonthDate}T00:00:00Z", _lte: "${today}T23:59:59Z"}, status: {_eq: "completed"}, partner_id: {_eq: "${userData?.id}"}}}
      ) {
        menu {
          category {
            name
          }
          price
        }
        quantity
      }
    }
  `;

  const CUSTOM_DATE_ORDERS_QUERY = `
    query CustomDateOrders($startDate: timestamptz!, $endDate: timestamptz!) {
      orders_aggregate(where: {created_at: {_gte: $startDate, _lte: $endDate}, status: {_eq: "completed"}, partner_id: {_eq: "${userData?.id}"}}) {
        aggregate {
          sum {
            total_price
          }
          count
        }
      }
      delivery_orders: orders_aggregate(where: {created_at: {_gte: $startDate, _lte: $endDate}, status: {_eq: "completed"}, type: {_eq: "delivery"}, partner_id: {_eq: "${userData?.id}"}}) {
        aggregate {
          count
        }
      }
      top_items: order_items(where: {order: {created_at: {_gte: $startDate, _lte: $endDate}, status: {_eq: "completed"}, partner_id: {_eq: "${userData?.id}"}}}, limit: 5, order_by: {quantity: desc}) {
        menu {
          name
          category {
            name
          }
        }
        quantity
      }
      daily_sales: orders_aggregate(
        where: {created_at: {_gte: $startDate, _lte: $endDate}, status: {_eq: "completed"}, partner_id: {_eq: "${userData?.id}"}}
        order_by: {created_at: asc}
      ) {
        nodes {
          total_price
          created_at
        }
      }
      category_stats: order_items(
        where: {order: {created_at: {_gte: $startDate, _lte: $endDate}, status: {_eq: "completed"}, partner_id: {_eq: "${userData?.id}"}}}
      ) {
        menu {
          category {
            name
          }
          price
        }
        quantity
      }
    }
  `;

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      let result;
      const today = formatDate(new Date());
      const startOfMonthDate = formatDate(startOfMonth(new Date()));

      switch (activeTab) {
        case "today":
          result = await fetchFromHasura(TODAY_ORDERS_QUERY(today));
          break;
        case "month":
          result = await fetchFromHasura(
            MONTHLY_ORDERS_QUERY(startOfMonthDate, today)
          );
          break;
        case "custom":
          result = await fetchFromHasura(CUSTOM_DATE_ORDERS_QUERY, {
            startDate: format(dateRange.startDate, "yyyy-MM-dd'T'00:00:00'Z'"),
            endDate: format(dateRange.endDate, "yyyy-MM-dd'T'23:59:59'Z'"),
          });
          break;
      }
      setReportData(result);
    } catch (error) {
      console.error("Error fetching report data:", error);
    } finally {
      setLoading(false);
    }
  }, [activeTab, dateRange.startDate, dateRange.endDate, userData?.id]);

  useEffect(() => {
    if (userData) {
      fetchData();
    }
  }, [fetchData, userData]);

  const handleDateRangeChange = useCallback(
    (range: { startDate: Date; endDate: Date }) => {
      if (
        range.startDate.getTime() !== dateRange.startDate.getTime() ||
        range.endDate.getTime() !== dateRange.endDate.getTime()
      ) {
        setDateRange(range);
      }
    },
    [dateRange.startDate, dateRange.endDate]
  );

  const prepareChartData = () => {
    if (!reportData?.daily_sales?.nodes) return [];

    return reportData.daily_sales.nodes.map((order: any) => ({
      date: format(new Date(order.created_at), "MMM dd"),
      sales: order.total_price,
    }));
  };

  const prepareCategoryData = () => {
    if (!reportData?.category_stats) return [];

    const categoryMap = new Map<
      string,
      { quantity: number; revenue: number }
    >();

    reportData.category_stats.forEach((item: any) => {
      const categoryName = item.menu.category.name;
      const existing = categoryMap.get(categoryName) || {
        quantity: 0,
        revenue: 0,
      };

      categoryMap.set(categoryName, {
        quantity: existing.quantity + item.quantity,
        revenue: existing.revenue + item.menu.price * item.quantity,
      });
    });

    return Array.from(categoryMap.entries()).map(([name, stats]) => ({
      name,
      quantity: stats.quantity,
      revenue: stats.revenue,
    }));
  };

  const handleDownloadXLSX = () => {
    if (!reportData) return;

    const currencySymbol = (userData as Partner)?.currency || '₹';

    // 1. DEFINE PROFESSIONAL STYLES
    const headerFont = { color: { rgb: "FFFFFFFF" }, bold: true, sz: 12 };
    const thinBorder = { top: { style: "thin" }, bottom: { style: "thin" }, left: { style: "thin" }, right: { style: "thin" } };
    const titleStyle = { font: { bold: true, sz: 18 }, alignment: { horizontal: "center", vertical: "center" } };
    const sectionHeaderStyle = { font: { bold: true, sz: 14 } };
    const tableHeaderStyle = {
      fill: { fgColor: { rgb: "FF4F81BD" }, patternType: "solid" },
      font: headerFont,
      border: thinBorder,
      alignment: { horizontal: "center" },
    };
    const tableCellStyle = { border: thinBorder };
    const summaryKeyStyle = { font: { bold: true } };

    // 2. PREPARE WORKSHEET DATA
    const topItemsData = reportData?.top_items || [];
    const categoryData = prepareCategoryData();
    const worksheetData = [
        ['Order Analytics Report', null, null],
        [],
        ['Summary'],
        ['Report Type', activeTab.charAt(0).toUpperCase() + activeTab.slice(1)],
        ['Start Date', format(dateRange.startDate, 'yyyy-MM-dd')],
        ['End Date', format(dateRange.endDate, 'yyyy-MM-dd')],
        [],
        ['Total Earnings', { v: reportData?.orders_aggregate?.aggregate?.sum?.total_price || 0, t: 'n', z: `${currencySymbol}#,##0.00` }],
        ['Orders Completed', reportData?.orders_aggregate?.aggregate?.count || 0],
        ['Deliveries', reportData?.delivery_orders?.aggregate?.count || 0],
        ['Average Order Value', { v: reportData?.orders_aggregate?.aggregate?.count ? (reportData.orders_aggregate.aggregate.sum.total_price / reportData.orders_aggregate.aggregate.count) : 0, t: 'n', z: `${currencySymbol}#,##0.00` }],
        [],
        ['Top Selling Items'],
        ['Item Name', 'Category', 'Quantity Sold'],
        ...topItemsData.map((item: any) => [item.menu.name, item.menu.category.name, item.quantity]),
        [],
        ['Category-wise Breakdown'],
        ['Category', 'Quantity Sold', 'Total Revenue'],
        ...categoryData.map((cat: any) => [cat.name, cat.quantity, { v: cat.revenue, t: 'n', z: `${currencySymbol}#,##0.00` }]),
    ];

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(worksheetData);
    
    // 3. APPLY STYLES AND FORMATTING
    ws['!cols'] = [{ wch: 35 }, { wch: 20 }, { wch: 20 }];
    ws['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 2 } }];
    ws['!rows'] = [{ hpt: 30 }];
    
    if (ws['A1']) ws['A1'].s = titleStyle;
    if (ws['A3']) ws['A3'].s = sectionHeaderStyle;

    ['A4', 'A5', 'A6', 'A8', 'A9', 'A10', 'A11'].forEach(cellRef => {
        if(ws[cellRef]) ws[cellRef].s = summaryKeyStyle;
    });

    const topItemsStartRow = 13;
    if (ws[`A${topItemsStartRow}`]) ws[`A${topItemsStartRow}`].s = sectionHeaderStyle;

    const topItemsHeaderRow = topItemsStartRow + 1;
    ['A', 'B', 'C'].forEach(col => {
        const cellRef = `${col}${topItemsHeaderRow}`;
        if(ws[cellRef]) ws[cellRef].s = tableHeaderStyle;
    });

    for (let i = 0; i < topItemsData.length; i++) {
      const row = topItemsHeaderRow + 1 + i;
      ['A', 'B', 'C'].forEach(col => {
        const cellRef = `${col}${row}`;
        const cell = ws[cellRef];
        if (cell) {
          cell.s = { ...(cell.s || {}), ...tableCellStyle };
        }
      });
    }

    const categoryStartRow = topItemsStartRow + topItemsData.length + 3;
    if (ws[`A${categoryStartRow}`]) ws[`A${categoryStartRow}`].s = sectionHeaderStyle;

    const categoryHeaderRow = categoryStartRow + 1;
    ['A', 'B', 'C'].forEach(col => {
        const cellRef = `${col}${categoryHeaderRow}`;
        if(ws[cellRef]) ws[cellRef].s = tableHeaderStyle;
    });

    for (let i = 0; i < categoryData.length; i++) {
      const row = categoryHeaderRow + 1 + i;
      ['A', 'B', 'C'].forEach(col => {
        const cellRef = `${col}${row}`;
        const cell = ws[cellRef];
        if (cell) {
          cell.s = { ...(cell.s || {}), ...tableCellStyle };
        }
      });
    }

    XLSX.utils.book_append_sheet(wb, ws, 'Order Report');
    XLSX.writeFile(wb, `Order_Report_${format(new Date(), 'yyyyMMdd_HHmmss')}.xlsx`);
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Order Analytics Dashboard</h1>

      <Tabs
        value={activeTab}
        onValueChange={(value) =>
          setActiveTab(value as "today" | "month" | "custom")
        }
      >
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="today">Today</TabsTrigger>
          <TabsTrigger value="month">This Month</TabsTrigger>
          <TabsTrigger value="custom">Custom Range</TabsTrigger>
        </TabsList>

        {activeTab === "custom" && (
          <div className="mb-6">
            <DateRangePicker
              onUpdate={handleDateRangeChange}
              initialDateFrom={dateRange.startDate}
              initialDateTo={dateRange.endDate}
              align="start"
            />
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Earnings
              </CardTitle>
              <span className="text-sm text-muted-foreground">₹</span>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-[100px]" />
              ) : (
                <div className="text-2xl font-bold">
                  {(userData as Partner)?.currency}
                  {reportData?.orders_aggregate?.aggregate?.sum?.total_price?.toFixed(
                    2
                  ) || 0}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Orders Completed
              </CardTitle>
              <span className="text-sm text-muted-foreground">#</span>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-[100px]" />
              ) : (
                <div className="text-2xl font-bold">
                  {reportData?.orders_aggregate?.aggregate?.count || 0}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Deliveries</CardTitle>
              <span className="text-sm text-muted-foreground">#</span>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-[100px]" />
              ) : (
                <div className="text-2xl font-bold">
                  {reportData?.delivery_orders?.aggregate?.count || 0}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Avg. Order Value
              </CardTitle>
              <span className="text-sm text-muted-foreground">₹</span>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-[100px]" />
              ) : (
                <div className="text-2xl font-bold">
                  {reportData?.orders_aggregate?.aggregate?.count
                    ? `₹${Math.round(
                        reportData.orders_aggregate.aggregate.sum.total_price /
                          reportData.orders_aggregate.aggregate.count
                      )}`
                    : "₹0"}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <TabsContent value={activeTab} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Sales Trend</CardTitle>
              </CardHeader>
              <CardContent className="pl-2">
                {loading ? (
                  <Skeleton className="h-[300px] w-full" />
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={prepareChartData()}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="sales" name="Sales (₹)" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Selling Items</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-4">
                    {[...Array(5)].map((_, i) => (
                      <Skeleton key={i} className="h-12 w-full" />
                    ))}
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Item</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead className="text-right">Quantity</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {reportData?.top_items?.map(
                        (item: any, index: number) => (
                          <TableRow key={index}>
                            <TableCell className="font-medium">
                              {item.menu.name}
                            </TableCell>
                            <TableCell>{item.menu.category.name}</TableCell>
                            <TableCell className="text-right">
                              {item.quantity}
                            </TableCell>
                          </TableRow>
                        )
                      )}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Category-wise Sales</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Skeleton className="h-[300px] w-full" />
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={prepareCategoryData()}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar
                        dataKey="revenue"
                        name="Revenue (₹)"
                        fill="#82ca9d"
                      />
                      <Bar dataKey="quantity" name="Quantity" fill="#ffc658" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Category-wise Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-4">
                    {[...Array(5)].map((_, i) => (
                      <Skeleton key={i} className="h-12 w-full" />
                    ))}
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Category</TableHead>
                        <TableHead className="text-right">Quantity</TableHead>
                        <TableHead className="text-right">Revenue</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {prepareCategoryData().map(
                        (category: any, index: number) => (
                          <TableRow key={index}>
                            <TableCell className="font-medium">
                              {category.name}
                            </TableCell>
                            <TableCell className="text-right">
                              {category.quantity}
                            </TableCell>
                            <TableCell className="text-right">
                              ₹{category.revenue}
                            </TableCell>
                          </TableRow>
                        )
                      )}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      <div className="mt-6 flex justify-end">
        <Button onClick={handleDownloadXLSX}>
          <Download className="mr-2 h-4 w-4" />
          Download Report
        </Button>
      </div>
    </div>
  );
};

export default OrderReport;
