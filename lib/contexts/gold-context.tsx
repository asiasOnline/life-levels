"use client"

import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useRef,
    useState
} from 'react'
import { 
    getUserStats,  
    awardGold,
    spendGold
} from '@/lib/actions/stats'
import type { GoldSource } from '@/lib/types/stats'

// -----------------------------------------
// Types
// -----------------------------------------

interface GoldDelta {
    id: number 
    amount: number 
    type: 'goldReceived' | 'goldRedeemed'
}

interface GoldContextValue {
    balance: number 
    isLoading: boolean 
    deltas: GoldDelta[]
    // Called by habits/tasks/goals/level-up completion
    handleGoldReceived: (amount: number, source: GoldSource, sourceId: string) => Promise<void>
    // Called by reward redemption
    handleGoldRedeemed: (amount: number, rewardId: string) => Promise<{ success: boolean; error?: string }>
    // Called after manual balance refresh (e.g. on page focus)
    refreshBalance: () => Promise<void>
}

// -----------------------------------------
// Context
// -----------------------------------------
const GoldContext = createContext<GoldContextValue | null>(null)

export function useGold(): GoldContextValue {
    const ctx = useContext(GoldContext)
    if (!ctx) throw new Error('The useGold function must be used within a GoldProvider.')
    return ctx
}

// -----------------------------------------
// Props
// -----------------------------------------

interface GoldProviderProps {
    children: React.ReactNode
    // Pass the balance fetched server-side on layout load to avoid a flash on first render.
    initialBalance?: number
}

// -----------------------------------------
// Main Component
// -----------------------------------------

export function GoldProvider({ children, initialBalance = 0 }: GoldProviderProps) {
    const [balance, setBalance] = useState(initialBalance)
    const [isLoading, setIsLoading] = useState(!initialBalance)
    const [deltas, setDeltas] = useState<GoldDelta[]>([])
    const deltaIdRef = useRef(0)

    // Hydrate from server if no iniital balance was provided
    useEffect(() => {
        if (initialBalance === 0) {
            refreshBalance()
        }
    }, [])

    const addDelta = useCallback((amount: number, type: 'goldReceived' | 'goldRedeemed') => {
        const id = ++deltaIdRef.current
        setDeltas(prev => [...prev, { id, amount, type}])
        // Remove after animation completes (1.8 sec)
        setTimeout(() => {
            setDeltas(prev => prev.filter(d => d.id !== id))
        }, 1800)
    }, [])

    const refreshBalance = useCallback(async () => {
        setIsLoading(true)
        const result = await getUserStats()
        if (result.success) {
            setBalance(result.data.gold)
        }
        setIsLoading(false)
    }, [])

    const handleGoldReceived = useCallback(
        async (amount: number, source: GoldSource, sourceId: string) => {
            setBalance(prev => prev + amount)
            addDelta(amount, 'goldReceived')

            const result = await awardGold({ amount, source, sourceId })
            if (!result.success) {
                // Rollback on failure
                setBalance(prev => prev - amount)
                setDeltas(prev => prev.slice(0, -1))
                console.error('Gold award failed:', result.error)
            } else {
                // Reconcile with server value in case of drift
                setBalance(result.data.newBalance)
            }
        },
        [addDelta]
    )

    const handleGoldRedeemed = useCallback(
        async (
            amount: number, 
            rewardId: string
        ): Promise<{ success: boolean; error?: string }> => {
            // Validate locally before update
            if (balance < amount) {
                return {
                    success: false,
                    error: `You need ${amount - balance} more Gold for this.`
                }
            }

            // Update
            setBalance(prev => prev - amount)
            addDelta(amount, 'goldRedeemed')

            const result = await spendGold(amount, rewardId) 
            if (!result.success) {
                // Rollback
                setBalance(prev => prev + amount)
                setDeltas(prev => prev.slice(0, -1))
                return { success: false, error: result.error }
            }

            setBalance(result.data.newBalance)
            return { success: true }
        },
        [balance, addDelta]
    )

    return (
        <GoldContext.Provider
            value={{
                balance,
                isLoading,
                deltas,
                handleGoldReceived,
                handleGoldRedeemed,
                refreshBalance
            }}
        >
            {children}
        </GoldContext.Provider>
    )
}