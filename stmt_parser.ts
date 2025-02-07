import { Attr, Stmt } from "./ast.ts";
import { Ty } from "./ast.ts";
import { Param } from "./ast.ts";
import { ParserBase } from "./parser_base.ts";

export abstract class StmtParser extends ParserBase {
    public override parseStmt(): Stmt {
        const attrs = this.parseAttrs();
        if (this.test("fn")) {
            return this.parseFnStmt(attrs);
        } else if (this.test("let")) {
            return this.parseLetStmt();
        } else if (this.test("{")) {
            return this.parseBlockStmt();
        } else if (this.test("if")) {
            return this.parseIfStmt();
        } else if (this.test("while")) {
            return this.parseWhileStmt();
        } else if (this.test("return")) {
            return this.parseReturnStmt();
        } else if (this.test("break")) {
            return this.parseBreakStmt();
        } else {
            const expr = this.parseExpr();
            if (this.test("=")) {
                this.step();
                const src = this.parseExpr();
                this.eatOrReport(";");
                return this.stmt(
                    { tag: "assign", dest: expr, src },
                    expr.pos,
                );
            } else {
                this.eatOrReport(";");
                return this.stmt({ tag: "expr", expr }, expr.pos);
            }
        }
    }

    private parseFnStmt(attrs?: Attr[]): Stmt {
        const pos = this.pos();
        this.step();
        if (!this.test("ident")) {
            this.rep.error("expected 'ident'", pos);
            return this.errorStmt(pos);
        }
        const ident = this.current().identVal!;
        this.step();
        if (!this.eatOrReport("(")) {
            return this.errorStmt(pos);
        }
        const params: Param[] = [];
        if (!this.done() && !this.test(")")) {
            const param = this.parseParam();
            if (!param) {
                return this.errorStmt(pos);
            }
            params.push(param);
            while (!this.done() && !this.test(")")) {
                if (!this.eatOrReport(",")) {
                    return this.errorStmt(pos);
                }
                if (this.test(")")) {
                    break;
                }
                const param = this.parseParam();
                if (!param) {
                    return this.errorStmt(pos);
                }
                params.push(param);
            }
        }
        if (!this.eatOrReport(")")) {
            return this.errorStmt(pos);
        }
        let returnTy: Ty | undefined = undefined;
        if (this.test("->")) {
            this.step();
            returnTy = this.parseTy();
        }
        const body = this.parseBlock();
        if (!body) {
            return this.errorStmt(pos);
        }
        return this.stmt(
            { tag: "fn", ident, params, returnTy, body },
            pos,
            attrs,
        );
    }

    private parseParam(): Param | undefined {
        const pos = this.pos();
        if (!this.test("ident")) {
            this.rep.error("expected 'ident'", pos);
            return;
        }
        const ident = this.current().identVal!;
        this.step();
        if (!this.eatOrReport(":")) {
            return;
        }
        const ty = this.parseTy();
        return { ident, ty, pos };
    }

    private parseLetStmt(): Stmt {
        const pos = this.pos();
        this.step();
        if (!this.test("ident")) {
            this.rep.error("expected 'ident'", pos);
            return this.errorStmt(pos);
        }
        const ident = this.current().identVal!;
        this.step();
        let ty: Ty | undefined = undefined;
        if (this.test(":")) {
            this.step();
            ty = this.parseTy();
        }
        if (!this.eatOrReport("=")) {
            return this.errorStmt(pos);
        }
        const expr = this.parseExpr();
        this.eatOrReport(";");
        return this.stmt({ tag: "let", ident, ty, expr }, pos);
    }

    private parseBlockStmt(): Stmt {
        const pos = this.pos();
        const block = this.parseBlock();
        if (!block) {
            return this.errorStmt(pos);
        }
        return this.stmt({ tag: "block", block }, block.pos);
    }

    private parseIfStmt(): Stmt {
        throw new Error("todo");
    }

    private parseWhileStmt(): Stmt {
        throw new Error("todo");
    }

    private parseReturnStmt(): Stmt {
        const pos = this.pos();
        this.step();
        if (this.test(";")) {
            this.step();
            return this.stmt({ tag: "return" }, pos);
        }
        const expr = this.parseExpr();
        this.eatOrReport(";");
        return this.stmt({ tag: "return", expr }, pos);
    }

    private parseBreakStmt(): Stmt {
        throw new Error("todo");
    }
}
