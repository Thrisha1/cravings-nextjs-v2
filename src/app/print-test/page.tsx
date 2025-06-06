'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useState } from "react";
import { toast } from "sonner";

const SilentPrintButton = () => {
  const [isPrinting, setIsPrinting] = useState(false);

  const handleSilentPrint = async () => {
    const content = document.getElementById('printable-content')?.innerHTML;
    if (!content) return;

    setIsPrinting(true);
    try {
      // Check if we're running in Electron
      if (window.electron) {
        console.log('Starting silent print...');
        const result = await window.electron.silentPrint(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>Print</title>
              <style>
                @page { 
                  size: auto;
                  margin: 10mm;
                }
                body { 
                  margin: 0; 
                  padding: 0;
                  width: 100%;
                  -webkit-print-color-adjust: exact;
                  print-color-adjust: exact;
                }
                .printable-content {
                  width: 100%;
                  max-width: 100%;
                  padding: 20px;
                  box-sizing: border-box;
                }
                table {
                  width: 100%;
                  border-collapse: collapse;
                  margin: 10px 0;
                }
                th, td {
                  border: 1px solid #000;
                  padding: 8px;
                  text-align: left;
                }
                th {
                  background-color: #f3f4f6;
                }
                @media print {
                  body { 
                    -webkit-print-color-adjust: exact;
                    print-color-adjust: exact;
                  }
                  .printable-content {
                    width: 100%;
                    max-width: 100%;
                  }
                }
              </style>
            </head>
            <body>
              <div class="printable-content">
                ${content}
              </div>
            </body>
          </html>
        `);

        console.log('Print result:', result);

        if (!result.success) {
          toast.error(result.error || 'Failed to print');
          console.error('Print error:', result.error);
        } else {
          toast.success('Printed successfully');
          console.log('Print completed successfully');
        }
      } else {
        console.log('Not in Electron, using regular print');
        window.print();
      }
    } catch (error) {
      toast.error('Failed to print. Please check if printer is connected.');
      console.error('Printing error:', error);
    } finally {
      setIsPrinting(false);
    }
  };

  return (
    <Button 
      onClick={handleSilentPrint} 
      variant="default"
      disabled={isPrinting}
    >
      {isPrinting ? 'Printing...' : 'Silent Print'}
    </Button>
  );
};

const PrintButton = () => {
  const handlePrint = () => {
    window.print();
  };

  return (
    <Button onClick={handlePrint} variant="outline">
      Regular Print
    </Button>
  );
};

export default function PrintTestPage() {
  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">Print Test Page</h1>
      
      <div className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Print Controls</CardTitle>
          </CardHeader>
          <CardContent className="space-x-4">
            <SilentPrintButton />
            <PrintButton />
          </CardContent>
        </Card>

        <Card id="printable-content">
          <CardHeader>
            <CardTitle>Printable Content</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p>This is a test content that will be printed.</p>
              <p>You can add any content here that you want to print.</p>
              <div className="border p-4 rounded-lg">
                <h3 className="font-semibold mb-2">Sample Table</h3>
                <table className="w-full border-collapse">
                  <thead>
                    <tr>
                      <th className="border p-2">Item</th>
                      <th className="border p-2">Quantity</th>
                      <th className="border p-2">Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border p-2">Item 1</td>
                      <td className="border p-2">2</td>
                      <td className="border p-2">$10.00</td>
                    </tr>
                    <tr>
                      <td className="border p-2">Item 2</td>
                      <td className="border p-2">1</td>
                      <td className="border p-2">$15.00</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 