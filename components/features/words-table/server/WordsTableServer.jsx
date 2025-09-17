import React from "react";
import { motion } from "framer-motion";
import WordsTableClient from "../client/WordsTableClient";
import BulkActionsBar from "../client/BulkActionsBar";
import PaginationServer from "./PaginationServer";

/**
 * Server component that renders the table structure
 * Combines server-rendered layout with client-side interactivity
 */
export default function WordsTableServer({
  data,
  pagination,
  rate,
  filters,
  refetch
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="overflow-hidden rounded-b-xl shadow-xl bg-white"
      whileHover={{
        boxShadow:
          "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
      }}
    >
        {/* Header with bulk actions - Client Component */}
        <div className="text-gray-300 bg-primary">
          <BulkActionsBar data={data} />
        </div>

        {/* Table content - Mix of server and client */}
        <WordsTableClient
          data={data}
          rate={rate}
          refetch={refetch}
        />
    </motion.div>
  );
}