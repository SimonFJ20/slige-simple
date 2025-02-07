import { Reporter } from "./info.ts";
import * as ast from "./ast.ts";

export class Resols {
    public constructor(
        private exprResols: Map<number, Res>,
        private tyResols: Map<number, Res>,
    ) {}
}

export type Res =
    | { tag: "fn"; stmt: ast.Stmt; kind: ast.FnStmt }
    | { tag: "fnParam"; stmt: ast.Stmt; kind: ast.FnStmt; idx: number }
    | { tag: "let"; stmt: ast.Stmt; kind: ast.LetStmt };

type Rib = {
    binds: Map<string, Res>;
    type: "normal" | "fn";
};

export class Resolver {
    private valRibs: Rib[] = [{ binds: new Map(), type: "normal" }];
    private tyRibs: Rib[] = [{ binds: new Map(), type: "normal" }];

    private lateFnBodyStack: [ast.Stmt, ast.FnStmt][][] = [];

    private exprResols = new Map<number, Res>();
    private tyResols = new Map<number, Res>();

    public constructor(
        private rep: Reporter,
    ) {}

    public resols(): Resols {
        return new Resols(
            this.exprResols,
            this.tyResols,
        );
    }

    public resolveFile(file: ast.FileAst) {
        this.lateFnBodyStack.push([]);
        for (const stmt of file.stmts) {
            this.resolveStmt(stmt);
        }
        this.resolveFnBodies();
    }

    private resolveBlock(block: ast.Block) {
        this.lateFnBodyStack.push([]);
        const point = this.ribPoint();
        this.pushRib("normal");
        for (const stmt of block.stmts) {
            this.resolveStmt(stmt);
        }
        this.resolveFnBodies();
        this.ribRestore(point);
    }

    private resolveFnBodies() {
        const fns = this.lateFnBodyStack.pop()!;
        for (const [stmt, kind] of fns) {
            const point = this.ribPoint();
            this.pushRib("fn");
            for (const [idx, param] of kind.params.entries()) {
                if (this.valIsDefined(param.ident)) {
                    this.rep.error(
                        `redefinition of param '${param.ident}'`,
                        param.pos,
                    );
                    continue;
                }
                this.defVal(param.ident, { tag: "fnParam", stmt, kind, idx });
            }
            this.resolveBlock(kind.body);
            this.ribRestore(point);
        }
    }

    private resolveStmt(stmt: ast.Stmt) {
        const k = stmt.kind;
        switch (k.tag) {
            case "error":
                return;
            case "fn":
                this.resolveFnStmt(stmt, k);
                return;
            case "let":
                this.resolveLetStmt(stmt, k);
                return;
            case "block":
                this.resolveBlock(k.block);
                return;
            case "if":
                this.resolveExpr(k.cond);
                this.resolveBlock(k.truthy);
                switch (k.falsy?.tag) {
                    case "block":
                        this.resolveBlock(k.falsy.block);
                        break;
                    case "if":
                        this.resolveStmt(k.falsy.stmt);
                        break;
                }
                return;
            case "while":
                this.resolveExpr(k.cond);
                this.resolveBlock(k.body);
                return;
            case "return":
                k.expr && this.resolveExpr(k.expr);
                return;
            case "break":
                return;
            case "assign":
                this.resolveExpr(k.dest);
                this.resolveExpr(k.src);
                return;
            case "expr":
                this.resolveExpr(k.expr);
                return;
        }
        const _: never = k;
    }

    private resolveFnStmt(stmt: ast.Stmt, kind: ast.FnStmt) {
        if (this.valIsDefined(kind.ident)) {
            this.rep.error(
                `redefinition of function '${kind.ident}'`,
                stmt.pos,
            );
            return;
        }
        this.defVal(kind.ident, { tag: "fn", stmt, kind });
        for (const param of kind.params) {
            this.resolveTy(param.ty);
        }
        kind.returnTy && this.resolveTy(kind.returnTy);
        this.lateFnBodyStack.at(-1)!.push([stmt, kind]);
    }

    private resolveLetStmt(stmt: ast.Stmt, kind: ast.LetStmt) {
        kind.ty && this.resolveTy(kind.ty);
        this.resolveExpr(kind.expr);
        this.pushRib("normal");
        this.defVal(kind.ident, { tag: "let", stmt, kind });
    }

    private resolveExpr(expr: ast.Expr) {
        const k = expr.kind;
        switch (k.tag) {
            case "error":
                return;
            case "ident":
                this.resolveIdentExpr(expr, k);
                return;
            case "unit":
                return;
            case "int":
                return;
            case "bool":
                return;
            case "str":
                return;
            case "tuple":
                for (const expr of k.exprs) {
                    this.resolveExpr(expr);
                }
                return;
            case "repeat":
                this.resolveExpr(k.expr);
                this.resolveExpr(k.len);
                return;
            case "array":
                for (const expr of k.exprs) {
                    this.resolveExpr(expr);
                }
                return;
            case "elem":
                this.resolveExpr(k.expr);
                return;
            case "index":
                this.resolveExpr(k.expr);
                this.resolveExpr(k.idx);
                return;
            case "call":
                this.resolveExpr(k.expr);
                for (const arg of k.args) {
                    this.resolveExpr(arg);
                }
                return;
            case "unary":
                this.resolveExpr(k.expr);
                return;
            case "binary":
                this.resolveExpr(k.left);
                this.resolveExpr(k.right);
                return;
        }
        const _: never = k;
    }

    private resolveIdentExpr(expr: ast.Expr, kind: ast.IdentExpr) {
        const res = this.getVal(kind.ident);
        if (!res) {
            this.rep.error(`used of undefined value '${kind.ident}'`, expr.pos);
            return;
        }
        this.exprResols.set(expr.id, res);
    }

    private resolveTy(ty: ast.Ty) {
        const k = ty.kind;
        switch (k.tag) {
            case "error":
                return;
            case "ident":
                this.resolveIdentTy(ty, k);
                return;
            case "unit":
                return;
            case "int":
                return;
            case "bool":
                return;
            case "str":
                return;
            case "tuple":
                for (const ty of k.tys) {
                    this.resolveTy(ty);
                }
                return;
            case "slice":
                this.resolveTy(k.ty);
                return;
            case "array":
                this.resolveTy(k.ty);
                this.resolveExpr(k.len);
                return;
        }
        const _: never = k;
    }

    private resolveIdentTy(expr: ast.Ty, kind: ast.IdentTy) {
        const res = this.getTy(kind.ident);
        if (!res) {
            this.rep.error(`used of undefined type '${kind.ident}'`, expr.pos);
            return;
        }
        this.exprResols.set(expr.id, res);
    }

    private ribPoint(): number {
        return this.valRibs.length;
    }
    private ribRestore(point: number) {
        this.valRibs = this.valRibs.slice(0, point);
        this.tyRibs = this.tyRibs.slice(0, point);
    }
    private pushRib(type: Rib["type"]) {
        this.valRibs.push({ binds: new Map(), type });
        this.tyRibs.push({ binds: new Map(), type });
    }

    private valIsDefined(ident: string): boolean {
        return this.valRibs.at(-1)!.binds.has(ident);
    }
    private tyIsDefined(ident: string): boolean {
        return this.tyRibs.at(-1)!.binds.has(ident);
    }

    private defVal(ident: string, res: Res) {
        this.valRibs.at(-1)!.binds.set(ident, res);
    }
    private defTy(ident: string, res: Res) {
        this.tyRibs.at(-1)!.binds.set(ident, res);
    }

    private getVal(
        ident: string,
        ribIdx = this.valRibs.length - 1,
    ): Res | undefined {
        if (ribIdx < 0) {
            return;
        }
        const rib = this.valRibs[ribIdx];
        if (rib.binds.has(ident)) {
            return rib.binds.get(ident)!;
        }
        const res = this.getVal(ident, ribIdx - 1);
        if (
            rib.type === "fn" && (res?.tag === "fnParam" || res?.tag === "let")
        ) {
            return undefined;
        }
        return res;
    }

    private getTy(
        ident: string,
        ribIdx = this.tyRibs.length - 1,
    ): Res | undefined {
        if (ribIdx < 0) {
            return;
        }
        const rib = this.tyRibs[ribIdx];
        if (rib.binds.has(ident)) {
            return rib.binds.get(ident)!;
        }
        const res = this.getTy(ident, ribIdx - 1);
        if (
            rib.type === "fn" && (res?.tag === "fnParam" || res?.tag === "let")
        ) {
            return undefined;
        }
        return res;
    }
}
