export default function DashboardPage() {
    return (
        <div className="space-y-4">
            <h1 className="text-2xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground">Welcome to the Auth Admin Dashboard.</p>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-xl border bg-card text-card-foreground shadow p-6">
                    <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <h3 className="tracking-tight text-sm font-medium">Total Users</h3>
                    </div>
                    <div className="text-2xl font-bold">--</div>
                </div>
                {/* Add more stats here */}
            </div>
        </div>
    )
}
