"use client"
import React, { useState, useEffect, useCallback } from 'react'
import { format, subDays, startOfMonth, endOfDay } from 'date-fns'
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { DateRangePicker } from '@/components/ui/date-range-picker'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { Download } from 'lucide-react'
import { Skeleton } from "@/components/ui/skeleton"
import { fetchFromHasura } from '@/lib/hasuraClient'
import { Partner, useAuthStore } from '@/store/authStore'

// Helper function to format date as YYYY-MM-DD
const formatDate = (date: Date) => format(date, 'yyyy-MM-dd')

const OrderReport = () => {
  const { userData } = useAuthStore()
  const [dateRange, setDateRange] = useState({
    startDate: subDays(new Date(), 7),
    endDate: new Date()
  })
  const [activeTab, setActiveTab] = useState<'today' | 'month' | 'custom'>('today')
  const [reportData, setReportData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

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
  `

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
  `

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
  `

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      let result
      const today = formatDate(new Date())
      const startOfMonthDate = formatDate(startOfMonth(new Date()))
      
      switch (activeTab) {
        case 'today':
          result = await fetchFromHasura(TODAY_ORDERS_QUERY(today))
          break
        case 'month':
          result = await fetchFromHasura(MONTHLY_ORDERS_QUERY(startOfMonthDate, today))
          break
        case 'custom':
          result = await fetchFromHasura(CUSTOM_DATE_ORDERS_QUERY, {
            startDate: format(dateRange.startDate, "yyyy-MM-dd'T'00:00:00'Z'"),
            endDate: format(dateRange.endDate, "yyyy-MM-dd'T'23:59:59'Z'")
          })
          break
      }
      setReportData(result)
    } catch (error) {
      console.error("Error fetching report data:", error)
    } finally {
      setLoading(false)
    }
  }, [activeTab, dateRange.startDate, dateRange.endDate, userData?.id])

  useEffect(() => {
    if(userData) {
      fetchData()
    }
  }, [fetchData , userData])

  const handleDateRangeChange = useCallback((range: { startDate: Date; endDate: Date }) => {
    if (
      range.startDate.getTime() !== dateRange.startDate.getTime() ||
      range.endDate.getTime() !== dateRange.endDate.getTime()
    ) {
      setDateRange(range)
    }
  }, [dateRange.startDate, dateRange.endDate])

  const prepareChartData = () => {
    if (!reportData?.daily_sales?.nodes) return []

    return reportData.daily_sales.nodes.map((order: any) => ({
      date: format(new Date(order.created_at), 'MMM dd'),
      sales: order.total_price
    }))
  }

  const prepareCategoryData = () => {
    if (!reportData?.category_stats) return []

    const categoryMap = new Map<string, { quantity: number, revenue: number }>()

    reportData.category_stats.forEach((item: any) => {
      const categoryName = item.menu.category.name
      const existing = categoryMap.get(categoryName) || { quantity: 0, revenue: 0 }
      
      categoryMap.set(categoryName, {
        quantity: existing.quantity + item.quantity,
        revenue: existing.revenue + (item.menu.price * item.quantity)
      })
    })

    return Array.from(categoryMap.entries()).map(([name, stats]) => ({
      name,
      quantity: stats.quantity,
      revenue: stats.revenue
    }))
  }

  const generateCSVData = () => {
    if (!reportData) return ''

    // Prepare summary data
    const summary = [
      ['Report Type', activeTab === 'today' ? 'Today' : activeTab === 'month' ? 'This Month' : 'Custom Range'],
      ['Start Date', activeTab === 'today' || activeTab === 'month' ? 
        format(activeTab === 'today' ? new Date() : startOfMonth(new Date()), 'yyyy-MM-dd') : 
        format(dateRange.startDate, 'yyyy-MM-dd')],
      ['End Date', activeTab === 'today' || activeTab === 'month' ? 
        format(new Date(), 'yyyy-MM-dd') : 
        format(dateRange.endDate, 'yyyy-MM-dd')],
      ['Total Earnings', `₹${reportData?.orders_aggregate?.aggregate?.sum?.total_price || 0}`],
      ['Orders Completed', reportData?.orders_aggregate?.aggregate?.count || 0],
      ['Deliveries', reportData?.delivery_orders?.aggregate?.count || 0],
      ['Average Order Value', reportData?.orders_aggregate?.aggregate?.count 
        ? `₹${Math.round(reportData.orders_aggregate.aggregate.sum.total_price / reportData.orders_aggregate.aggregate.count)}`
        : '₹0'],
      [],
      ['Top Selling Items', '', ''],
      ['Item Name', 'Category', 'Quantity']
    ]

    // Add top items
    reportData?.top_items?.forEach((item: any) => {
      summary.push([item.menu.name, item.menu.category.name, item.quantity])
    })

    summary.push([], ['Category-wise Breakdown', '', ''])
    summary.push(['Category', 'Quantity', 'Revenue'])

    // Add category data
    prepareCategoryData().forEach((category: any) => {
      summary.push([category.name, category.quantity, `₹${category.revenue}`])
    })

    // Convert to CSV string
    return summary.map(row => row.join(',')).join('\n')
  }

  const handleDownloadReport = () => {
    const csvData = generateCSVData()
    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute('download', `order_report_${format(new Date(), 'yyyyMMdd_HHmmss')}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Order Analytics Dashboard</h1>
      
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'today' | 'month' | 'custom')}>
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="today">Today</TabsTrigger>
          <TabsTrigger value="month">This Month</TabsTrigger>
          <TabsTrigger value="custom">Custom Range</TabsTrigger>
        </TabsList>

        {activeTab === 'custom' && (
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
                {(userData as Partner)?.currency}{reportData?.orders_aggregate?.aggregate?.sum?.total_price?.toFixed(2) || 0}
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
              <CardTitle className="text-sm font-medium">
                Deliveries
              </CardTitle>
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
                    ? `₹${Math.round(reportData.orders_aggregate.aggregate.sum.total_price / reportData.orders_aggregate.aggregate.count)}`
                    : '₹0'}
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
                      {reportData?.top_items?.map((item: any, index: number) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{item.menu.name}</TableCell>
                          <TableCell>{item.menu.category.name}</TableCell>
                          <TableCell className="text-right">{item.quantity}</TableCell>
                        </TableRow>
                      ))}
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
                      <Bar dataKey="revenue" name="Revenue (₹)" fill="#82ca9d" />
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
                      {prepareCategoryData().map((category: any, index: number) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{category.name}</TableCell>
                          <TableCell className="text-right">{category.quantity}</TableCell>
                          <TableCell className="text-right">₹{category.revenue}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      <div className="mt-6 flex justify-end">
        <Button onClick={handleDownloadReport}>
          <Download className="mr-2 h-4 w-4" />
          Download Report
        </Button>
      </div>
    </div>
  )
}

export default OrderReport