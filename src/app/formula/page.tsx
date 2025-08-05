
import { FormulaTab } from "@/components/formula-tab";
import ToolPageLayout from "@/components/tool-page-layout";
import { FunctionSquare } from "lucide-react";

export default function FormulaPage() {
    return (
        <ToolPageLayout
            title="Formula Editor & Solver"
            subtitle="Write, render, and recognize math formulas with ease."
            icon={FunctionSquare}
        >
            <FormulaTab />
        </ToolPageLayout>
    );
}
