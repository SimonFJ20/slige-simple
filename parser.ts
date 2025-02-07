import { AstCx, Expr, Stmt, Ty } from "./ast.ts";
import { ExprParser } from "./expr_parser.ts";
import { Reporter } from "./info.ts";
import { ParserBase, ParserCx } from "./parser_base.ts";
import { StmtParser } from "./stmt_parser.ts";
import { TyParser } from "./ty_parser.ts";

export class StmtParserC extends StmtParser {
    protected override parseExpr(): Expr {
        return new ExprParserC(this.cx).parseExpr();
    }
    protected override parseTy(): Ty {
        return new TyParserC(this.cx).parseTy();
    }
}

export class ExprParserC extends ExprParser {
    protected override parseStmt(): Stmt {
        return new StmtParserC(this.cx).parseStmt();
    }
    protected override parseTy(): Ty {
        return new TyParserC(this.cx).parseTy();
    }
}

export class TyParserC extends TyParser {
    protected override parseStmt(): Stmt {
        return new StmtParserC(this.cx).parseStmt();
    }
    protected override parseExpr(): Expr {
        return new ExprParserC(this.cx).parseExpr();
    }
}

export class Parser extends ParserBase {
    public constructor(
        cx: AstCx,
        text: string,
        rep: Reporter,
    ) {
        super(new ParserCx(cx, text, rep));
    }

    public override parseStmt(): Stmt {
        return new StmtParserC(this.cx).parseStmt();
    }
    public override parseExpr(): Expr {
        return new ExprParserC(this.cx).parseExpr();
    }
    public override parseTy(): Ty {
        return new TyParserC(this.cx).parseTy();
    }
}
