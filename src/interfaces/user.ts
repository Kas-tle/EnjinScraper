
export namespace User {
    export interface Login {
        session_id: string;
    }
}

type UsersTuple = [
    string, string, string, string, string, string, string, string, string, string, 
    string, string, string, string, string, string|null, string
]
export interface UsersDB extends Array<UsersTuple[number]> {}