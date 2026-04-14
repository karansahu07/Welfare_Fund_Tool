"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import useApiCall from "@/hooks/useApiCall";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import ImageModal from "../ImageModal";

type Txn = {
  username: string;
  userId: string;
  utr: string;
  amount: number;
  status: string;
  screenshotUrl: string;
  date: string;
};

type Employee = {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
};

const getYearsArray = () => {
  const currentYear = new Date().getFullYear();
  const years = [];

  for (let i = currentYear - 4; i <= currentYear + 2; i++) {
    years.push(i.toString());
  }
  return years;
}

export default function LastTransactionPage() {
  const [transactions, setTransactions] = useState<Txn[]>([]);
  const [fetchState, fetchTransactions] = useApiCall('/api/payments')
  const [selectedMonth, setSelectedMonth] = useState(String(new Date().getMonth() + 1).padStart(2, "0"));
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [modalOpen, setModalOpen] = useState(false);
  const [modalImage, setModalImage] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      const data = await fetchTransactions({ month: selectedMonth, year: selectedYear });
      setTransactions(data);
      console.log("data usid", data);
    }
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMonth, selectedYear]);

  useEffect(() => {
    if (fetchState.isSuccess) {
      toast.success("data load success")
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchState.isLoading])

  // const fetchTransactions = async () => {
  //   try {
  //     const res = await fetch("/api/payments");
  //     const data = await res.json();
  //     setTransactions(data);
  //   } catch (err) {
  //     console.error("Failed to fetch payments:", err);
  //   }
  // };

  // const fetchEmployees = async () => {
  //   try {
  //     const res = await fetch("/api/employees");
  //     const data = await res.json();
  //     setEmployees(data?.data || []);
  //   } catch (err) {
  //     console.error("Failed to fetch employees:", err);
  //   }
  // };




  const openModal = (img: string) => {
    setModalImage(img);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setModalImage("");
  };

  const months = [
    { value: "01", label: "January" },
    { value: "02", label: "February" },
    { value: "03", label: "March" },
    { value: "04", label: "April" },
    { value: "05", label: "May" },
    { value: "06", label: "June" },
    { value: "07", label: "July" },
    { value: "08", label: "August" },
    { value: "09", label: "September" },
    { value: "10", label: "October" },
    { value: "11", label: "November" },
    { value: "12", label: "December" },
  ];

  const years = getYearsArray();

  return (
    <div className="flex-1 space-y-4">
      <div className="space-y-4 p-4 md:p-8 pt-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <h2 className="text-3xl font-bold tracking-tight text-indigo-700 dark:text-indigo-300">
            All Transactions
          </h2>
          <div className="flex gap-2">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="rounded border border-gray-300 dark:border-gray-500 p-2 bg-white dark:bg-gray-700 text-sm"
            >
              {months.map((month) => (
                <option key={month.value} value={month.value}>
                  {month.label}
                </option>
              ))}
            </select>
            <select
              value={selectedYear}
              onChange={(e: any) => setSelectedYear(e.target.value)}
              className="rounded border border-gray-300 dark:border-gray-500 p-2 bg-white dark:bg-gray-700 text-sm"
            >
              {years.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="rounded-md border shadow-sm overflow-x-auto">
          <Table>
            <TableHeader className="bg-indigo-100 dark:bg-indigo-900">
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>UTR / Payment ID</TableHead>
                <TableHead>Amount (₹)</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date & Time</TableHead>
                <TableHead>Screenshot</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions?.length > 0 && (
                transactions.map((txn, index) => {
                  // const hasPaid = Boolean(txn);
                  // const status = hasPaid ? "paid" : "pending";
                  // const screenshotUrl = hasPaid ? txn?.screenshotUrl : "";
                  const dateStr = txn.date
                    ? new Date(txn!.date).toLocaleDateString()
                    : "-";
                  const timeStr = txn.date
                    ? new Date(txn!.date).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                    : "-";

                  return (
                    <TableRow key={index}>
                      <TableCell>
                        {txn.username}
                      </TableCell>
                      <TableCell>{txn?.utr || "-"}</TableCell>
                      <TableCell>
                        {txn?.amount ? `₹${txn.amount}` : "-"}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`px-2 py-1 rounded text-xs font-semibold ${txn.status === "paid"
                            ? "bg-green-200 text-green-800"
                            : "bg-yellow-200 text-yellow-800"
                            }`}
                        >
                          {txn.status}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-700 dark:text-gray-200">
                          {dateStr} {timeStr}
                        </span>
                      </TableCell>
                      <TableCell>
                        {txn.screenshotUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={txn.screenshotUrl}
                            alt="Screenshot"
                            onClick={() => openModal(txn.screenshotUrl)}
                            className="h-16 w-auto rounded shadow-md cursor-pointer hover:scale-105 transition-transform duration-200"
                          />
                        ) : (
                          "-"
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}{
                fetchState.isLoading &&
                (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-gray-500 p-4">
                    Loading....
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Modal for Screenshot Preview */}
      <ImageModal open={modalOpen} onClose={closeModal} imageSrc={modalImage} />
      {/* {modalOpen && (
        <div
          onClick={closeModal}
          className="fixed inset-0 bg-black bg-opacity-70 z-50 flex items-center justify-center"
        >
          <div className="bg-white p-4 rounded-lg shadow-lg max-w-3xl max-h-[90vh] overflow-auto">
            <img
              src={modalImage}
              alt="Full Screenshot"
              className="w-full h-auto rounded"
            />
          </div>
        </div>
      )} */}
    </div>
  );
}
