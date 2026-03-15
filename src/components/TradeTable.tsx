"use client";

import { useState } from 'react';
import { Trade } from '@/lib/mock-data';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface TradeTableProps {
  trades: Trade[];
}

export function TradeTable({ trades }: TradeTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;
  const totalPages = Math.ceil(trades.length / itemsPerPage);

  const paginatedTrades = trades.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-md border border-white/5 bg-[#13131A] overflow-hidden">
        <Table>
          <TableHeader className="bg-white/5">
            <TableRow className="hover:bg-transparent border-white/5">
              <TableHead className="w-[100px] text-xs uppercase text-muted-foreground font-semibold">ID</TableHead>
              <TableHead className="text-xs uppercase text-muted-foreground font-semibold">Type</TableHead>
              <TableHead className="text-xs uppercase text-muted-foreground font-semibold text-right">Qty</TableHead>
              <TableHead className="text-xs uppercase text-muted-foreground font-semibold text-right">Entry</TableHead>
              <TableHead className="text-xs uppercase text-muted-foreground font-semibold text-right">Exit</TableHead>
              <TableHead className="text-xs uppercase text-muted-foreground font-semibold text-right">P&L</TableHead>
              <TableHead className="text-xs uppercase text-muted-foreground font-semibold text-right">Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedTrades.map((trade) => (
              <TableRow key={trade.id} className="border-white/5 hover:bg-white/[0.02]">
                <TableCell className="font-mono-data text-xs py-3">{trade.id}</TableCell>
                <TableCell className="py-3">
                  <div className="flex items-center gap-2">
                    <Badge className={trade.type === 'BUY' ? 'bg-status-buy text-black' : 'bg-status-sell text-white'}>
                      {trade.type}
                    </Badge>
                    <Badge variant="outline" className={trade.orderType === 'MARKET' ? 'border-status-amber text-status-amber' : 'border-status-blue text-status-blue'}>
                      {trade.orderType}
                    </Badge>
                  </div>
                </TableCell>
                <TableCell className="font-mono-data text-sm text-right py-3">{trade.quantity.toFixed(3)}</TableCell>
                <TableCell className="font-mono-data text-sm text-right py-3">${trade.entryPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}</TableCell>
                <TableCell className="font-mono-data text-sm text-right py-3 text-muted-foreground">
                  {trade.exitPrice ? `$${trade.exitPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : '—'}
                </TableCell>
                <TableCell className={`font-mono-data text-sm text-right py-3 ${trade.pnl && trade.pnl > 0 ? 'text-status-buy' : trade.pnl && trade.pnl < 0 ? 'text-status-sell' : 'text-muted-foreground'}`}>
                  {trade.pnl ? `${trade.pnl > 0 ? '+' : ''}${trade.pnl.toFixed(2)}` : '—'}
                </TableCell>
                <TableCell className="font-mono-data text-xs text-right text-muted-foreground py-3">
                  {new Date(trade.timestamp).toLocaleDateString()}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">
          Page {currentPage} of {totalPages}
        </span>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className="border-white/10 hover:bg-white/5"
          >
            <ChevronLeft className="w-4 h-4 mr-1" /> Prev
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
            className="border-white/10 hover:bg-white/5"
          >
            Next <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </div>
    </div>
  );
}
