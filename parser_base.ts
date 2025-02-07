import { Pos, Reporter } from "./info.ts";
import { Lexer, Token } from "./lexer.ts";
import { AstCx, Attr, Expr, FileAst, Stmt } from "./ast.ts";
import { TyKind } from "./ast.ts";
import { Ty } from "./ast.ts";
import { ExprKind } from "./ast.ts";
import { StmtKind } from "./ast.ts";
import { Block } from "./ast.ts";

export class ParserCx {
    public lexer: Lexer;
    public currentTok?: Token;

    public constructor(
        public astCx: AstCx,
        public text: string,
        public rep: Reporter,
    ) {
        this.lexer = new Lexer(this.text, this.rep);
        this.currentTok = this.lexer.next();
    }
}

export abstract class ParserBase {
    protected rep: Reporter;

    public constructor(
        protected cx: ParserCx,
    ) {
        this.rep = this.cx.rep;
    }

    public parseFile(): FileAst {
        const stmts: Stmt[] = [];
        while (!this.done()) {
            stmts.push(this.parseStmt());
        }
        return { stmts };
    }

    public parseBlock(): Block | undefined {
        const pos = this.pos();
        this.step();
        const stmts: Stmt[] = [];
        while (!this.done() && !this.test("}")) {
            stmts.push(this.parseStmt());
        }
        if (!this.eatOrReport("}")) {
            return;
        }
        return { stmts, pos };
    }

    public parseAttrs(): Attr[] | undefined {
        const attrs: Attr[] = [];
        while (this.test("#")) {
            const pos = this.pos();
            if (!this.eatOrReport("[")) {
                return undefined;
            }
            if (!this.test("ident")) {
                this.rep.error(`expected 'ident'`, pos);
                return undefined;
            }
            const ident = this.current().identVal!;
            this.step();
            if (!this.eatOrReport("]")) {
                return undefined;
            }
            attrs.push({ ident, pos });
        }
        return attrs.length !== 0 ? attrs : undefined;
    }

    protected abstract parseStmt(): Stmt;
    protected abstract parseExpr(): Expr;
    protected abstract parseTy(): Ty;

    protected eatOrReport(type: string): boolean {
        const pos = this.pos();
        if (!this.eat(type)) {
            this.rep.error(`expected '${type}'`, pos);
            return false;
        }
        return true;
    }

    protected eat(type: string): boolean {
        if (!this.test(type)) {
            return false;
        }
        this.step();
        return true;
    }

    protected step() {
        this.cx.currentTok = this.cx.lexer.next();
    }

    protected test(type: string): boolean {
        return !this.done() && this.current().type === type;
    }

    protected pos(): Pos {
        return this.cx.currentTok?.pos ?? this.cx.lexer.pos();
    }

    protected current(): Token {
        return this.cx.currentTok!;
    }

    protected done(): boolean {
        return this.cx.currentTok === undefined;
    }

    protected errorStmt(pos: Pos): Stmt {
        return this.stmt({ tag: "error" }, pos);
    }
    protected errorExpr(pos: Pos): Expr {
        return this.expr({ tag: "error" }, pos);
    }
    protected errorTy(pos: Pos): Ty {
        return this.ty({ tag: "error" }, pos);
    }

    protected stmt(kind: StmtKind, pos: Pos, attrs?: Attr[]): Stmt {
        return this.cx.astCx.stmt(kind, pos, attrs);
    }
    protected expr(kind: ExprKind, pos: Pos): Expr {
        return this.cx.astCx.expr(kind, pos);
    }
    protected ty(kind: TyKind, pos: Pos): Ty {
        return this.cx.astCx.ty(kind, pos);
    }
}
