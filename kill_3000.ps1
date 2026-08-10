$port = 3000
$tcp = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
if ($tcp) {
    echo "Found process on port $port"
    try {
        $proc = Get-Process -Id $tcp.OwningProcess -ErrorAction SilentlyContinue
        if ($proc) {
            $proc | Stop-Process -Force
            echo "Killed process $($proc.Id)"
        } else {
            echo "Process not found for ID $($tcp.OwningProcess)"
        }
    } catch {
        echo "Error killing process: $_"
    }
} else {
    echo "No process found on port $port"
}
