import { Pos, Reporter } from "./info.ts";

export type Token = {
    type: string;
    pos: Pos;
    identVal?: string;
    intVal?: number;
    strVal?: string;
};

export class Lexer {
    private index = 0;
    private line = 1;
    private col = 1;

    public constructor(
        private text: string,
        private rep: Reporter,
    ) {}

    public collect(): Token[] {
        const toks: Token[] = [];
        let tok = this.next();
        while (tok !== undefined) {
            toks.push(tok);
            tok = this.next();
        }
        return toks;
    }

    public next(): Token | undefined {
        const pos = this.pos();

        if (this.done()) {
            return undefined;
        }

        if (this.test(/[ \t\r\n]/)) {
            while (this.test(/[ \t\r\n]/)) {
                this.step();
            }
            return this.next();
        }

        if (this.test(/[a-zA-Z_]/)) {
            let value = "";
            while (this.test(/[a-zA-z0-9_]/)) {
                value += this.current();
                this.step();
            }
            if (keywords.includes(value)) {
                return { type: value, pos };
            } else {
                return { type: "ident", pos, identVal: value };
            }
        }

        if (this.test(/[1-9]/)) {
            let value = "";
            while (this.test(/[0-9_]/)) {
                value += this.current();
                this.step();
            }
            return { type: "int", pos, intVal: parseInt(value) };
        }

        if (this.test("0")) {
            this.step();
            return { type: "int", pos, intVal: 0 };
        }

        if (this.test(/"/)) {
            this.step();
            let value = "";
            while (!this.done() && !this.test(/"/)) {
                if (this.test("\\")) {
                    this.step();
                    const ch = this.current();
                    value += escapeChars[ch] ?? ch;
                } else {
                    value += this.current();
                }
                this.step();
            }
            if (!this.test(/"/)) {
                this.rep.error("unterminated string", this.pos());
                return { type: "error", pos };
            }
            this.step();
            return { type: "str", pos, strVal: value };
        }

        if (this.test(/^\/\//)) {
            while (!this.done() && !this.test("\n")) {
                this.step();
            }
            return this.next();
        }

        if (this.test(/^->/)) {
            this.step();
            this.step();
            return { type: "->", pos };
        }

        if (this.test(/^==/)) {
            this.step();
            this.step();
            return { type: "==", pos };
        }

        if (this.test(/^!=/)) {
            this.step();
            this.step();
            return { type: "!=", pos };
        }

        if (this.test("()[]{},.;:+-*/<>=!")) {
            const type = this.current();
            this.step();
            return { type, pos };
        }

        this.rep.error(`invalid character '${this.current()}'`, pos);
        this.step();
        return { type: "error", pos };
    }

    private step() {
        if (this.done()) {
            return;
        }
        if (this.test("\n")) {
            this.line += 1;
            this.col = 1;
        } else {
            this.col += 1;
        }
        this.index += 1;
    }

    private test(pattern: RegExp | string): boolean {
        if (this.done()) {
            return false;
        }
        if (typeof pattern === "string") {
            return pattern.includes(this.current());
        } else if (pattern.source.startsWith("^")) {
            return pattern.test(this.text.slice(this.index));
        } else {
            return pattern.test(this.current());
        }
    }

    private current(): string {
        return this.text[this.index];
    }

    private done(): boolean {
        return this.index >= this.text.length;
    }

    public pos(): Pos {
        return { index: this.index, line: this.line, col: this.col };
    }
}

const keywords = [
    "fn",
    "return",
    "let",
    "if",
    "else",
    "loop",
    "break",
    "and",
    "or",
    "not",
];

const escapeChars: Record<string, string> = {
    "0": "\0",
    "t": "\t",
    "r": "\r",
    "n": "\n",
};
