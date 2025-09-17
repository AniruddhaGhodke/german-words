'use client'

import { SessionProvider } from "next-auth/react"
import ReduxProvider from "./ReduxProvider"

const Provider = ({children, session}) => {
    return (
        <ReduxProvider>
            <SessionProvider session={session}>
                {children}
            </SessionProvider>
        </ReduxProvider>
    )
}

export default Provider;