import { Pos } from "./info.ts";

export type FileAst = {
    stmts: Stmt[];
};

export type Block = {
    stmts: Stmt[];
    expr?: Expr;
    pos: Pos;
};

export type Stmt = {
    id: number;
    kind: StmtKind;
    pos: Pos;
    attrs?: Attr[];
};

export type Attr = {
    ident: string;
    pos: Pos;
};

export type StmtKind =
    | { tag: "error" }
    | { tag: "fn" } & FnStmt
    | { tag: "let" } & LetStmt
    | { tag: "block" } & BlockStmt
    | { tag: "if" } & IfStmt
    | { tag: "while" } & WhileStmt
    | { tag: "return" } & ReturnStmt
    | { tag: "break" }
    | { tag: "assign" } & AssignStmt
    | { tag: "expr" } & ExprStmt;

export type FnStmt = {
    ident: string;
    params: Param[];
    returnTy?: Ty;
    body: Block;
};

export type LetStmt = { ident: string; ty?: Ty; expr: Expr };
export type BlockStmt = { block: Block };
export type IfStmt = { cond: Expr; truthy: Block; falsy?: IfTail };
export type WhileStmt = { cond: Expr; body: Block };
export type ReturnStmt = { expr?: Expr };
export type AssignStmt = { dest: Expr; src: Expr };
export type ExprStmt = { expr: Expr };

export type Param = {
    ident: string;
    ty: Ty;
    pos: Pos;
};

export type IfTail =
    | { tag: "block"; block: Block }
    | { tag: "if"; stmt: Stmt };

export type Expr = {
    id: number;
    kind: ExprKind;
    pos: Pos;
};

export type ExprKind =
    | { tag: "error" }
    | { tag: "ident" } & IdentExpr
    | { tag: "unit" }
    | { tag: "int" } & IntExpr
    | { tag: "bool" } & BoolExpr
    | { tag: "str" } & StrExpr
    | { tag: "tuple" } & TupleExpr
    | { tag: "repeat" } & RepeatExpr
    | { tag: "array" } & ArrayExpr
    | { tag: "elem" } & ElemExpr
    | { tag: "index" } & IndexExpr
    | { tag: "call" } & CallExpr
    | { tag: "unary" } & UnaryExpr
    | { tag: "binary" } & BinaryExpr;

export type IdentExpr = { ident: string };
export type IntExpr = { val: number };
export type BoolExpr = { val: boolean };
export type StrExpr = { val: string };
export type TupleExpr = { exprs: Expr[] };
export type RepeatExpr = { expr: Expr; len: Expr };
export type ArrayExpr = { exprs: Expr[] };
export type ElemExpr = { expr: Expr; elem: number };
export type IndexExpr = { expr: Expr; idx: Expr };
export type CallExpr = { expr: Expr; args: Expr[] };
export type UnaryExpr = { expr: Expr; op: UnaryOp };
export type BinaryExpr = { left: Expr; right: Expr; op: BinaryOp };

export type UnaryOp = "not" | "-";
export type BinaryOp =
    | "or"
    | "and"
    | "=="
    | "!="
    | "<"
    | ">"
    | "+"
    | "-"
    | "*"
    | "/";

export type Ty = {
    id: number;
    kind: TyKind;
    pos: Pos;
};

export type TyKind =
    | { tag: "error" }
    | { tag: "ident" } & IdentTy
    | { tag: "unit" }
    | { tag: "int" }
    | { tag: "bool" }
    | { tag: "str" }
    | { tag: "tuple" } & TupleTy
    | { tag: "slice" } & SliceTy
    | { tag: "array" } & ArrayTy;

export type IdentTy = { ident: string };
export type TupleTy = { tys: Ty[] };
export type SliceTy = { ty: Ty };
export type ArrayTy = { ty: Ty; len: Expr };

export class AstCx {
    private ids = 0;

    private stmts = new Map<number, Stmt>();
    private exprs = new Map<number, Expr>();
    private tys = new Map<number, Ty>();

    public stmt(kind: StmtKind, pos: Pos, attrs?: Attr[]): Stmt {
        const id = this.id();
        const v: Stmt = { id, kind, pos, attrs };
        this.stmts.set(id, v);
        return v;
    }

    public expr(kind: ExprKind, pos: Pos): Expr {
        const id = this.id();
        const v: Expr = { id, kind, pos };
        this.exprs.set(id, v);
        return v;
    }

    public ty(kind: TyKind, pos: Pos): Ty {
        const id = this.id();
        const v: Ty = { id, kind, pos };
        this.tys.set(id, v);
        return v;
    }

    private id(): number {
        const id = this.ids;
        this.ids += 1;
        return id;
    }
}
