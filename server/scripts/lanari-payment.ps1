param([string]$PaymentData)

$data = $PaymentData | ConvertFrom-Json

# Build request body
$body = @{
    api_key = $data.api_key
    api_secret = $data.api_secret
    amount = [int]$data.amount
    customer_phone = [string]$data.customer_phone
    currency = $data.currency
    description = $data.description
    reference_id = $data.reference_id
} | ConvertTo-Json -Compress

try {
    # Use .NET WebClient for better control over error handling
    $client = New-Object System.Net.WebClient
    $client.Headers.Add("Content-Type", "application/json")
    
    try {
        $result = $client.UploadString("https://www.lanari.rw/lanari_pay/api/payment/process.php", "POST", $body)
        Write-Host $result
        exit 0
    } catch {
        # WebClient throws on non-2xx status, but we can still get the response
        $exception = $_.Exception
        if ($exception.InnerException) {
            $webResponse = $exception.InnerException.Response
            if ($webResponse) {
                $streamReader = New-Object System.IO.StreamReader($webResponse.GetResponseStream())
                $streamReader.BaseStream.Position = 0
                $responseBody = $streamReader.ReadToEnd()
                $streamReader.Dispose()
                Write-Host $responseBody
                exit 0
            }
        }
        
        # If we couldn't get the response body, throw the error as JSON
        Write-Host (@{
            success = $false
            message = $exception.Message
            error = $exception.Message
        } | ConvertTo-Json)
        exit 1
    }
} catch {
    Write-Host (@{
        success = $false
        message = $_.Exception.Message
        error = $_.Exception.Message
    } | ConvertTo-Json)
    exit 1
}
