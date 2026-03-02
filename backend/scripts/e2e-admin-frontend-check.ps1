$ErrorActionPreference = 'Stop'

$base = 'http://localhost:5000'
$adminEmail = 'admin@gmail.com'
$adminPassword = 'Admin@123'

$adminHeaders = @{
  'x-admin-email' = $adminEmail
  'x-admin-password' = $adminPassword
}

$jsonHeaders = @{
  'x-admin-email' = $adminEmail
  'x-admin-password' = $adminPassword
  'Content-Type' = 'application/json'
}

$categories = Invoke-RestMethod -Method Get -Uri "$base/categories"

if (-not $categories -or $categories.Count -eq 0) {
  $newCategoryBody = @{
    name = 'E2E Test Category'
    slug = 'e2e-test-category'
    icon = '🍽️'
    sortOrder = 999
  } | ConvertTo-Json -Compress

  $createdCategory = Invoke-RestMethod -Method Post -Uri "$base/categories" -Headers $jsonHeaders -Body $newCategoryBody
  $categoryId = $createdCategory.id
} else {
  $categoryId = $categories[0].id
}

$imagePath = 'c:/Users/Dell/OneDrive/Documents/Chat App/lebanase-flame-react/frontend/src/assets/hero-food.jpg'
$uploadRaw = & curl.exe -s -X POST "$base/menu/upload" -H "x-admin-email: $adminEmail" -H "x-admin-password: $adminPassword" -F "image=@$imagePath"
$uploadResult = $uploadRaw | ConvertFrom-Json

if (-not $uploadResult.url) {
  throw "Image upload failed: $uploadRaw"
}

$timestamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$itemName = "E2E Sync Item $timestamp"

$newItemBody = @{
  name = $itemName
  description = 'Created by automated admin->frontend sync check'
  price = 9.99
  category = $categoryId
  image = $uploadResult.url
  isAvailable = $true
  isPopular = $true
  isVegetarian = $false
  isVegan = $false
  isSpicy = $false
} | ConvertTo-Json -Compress

$createdItem = Invoke-RestMethod -Method Post -Uri "$base/menu" -Headers $jsonHeaders -Body $newItemBody

$publicMenu = Invoke-RestMethod -Method Get -Uri "$base/menu"
$found = $publicMenu | Where-Object { $_.id -eq $createdItem.id -or $_.name -eq $itemName } | Select-Object -First 1

if ($null -eq $found) {
  throw 'Created admin menu item was not found in frontend/public /menu response.'
}

Write-Output ('E2E_OK')
Write-Output ("CREATED_ITEM_ID={0}" -f $createdItem.id)
Write-Output ("CREATED_ITEM_NAME={0}" -f $itemName)
Write-Output ("CATEGORY={0}" -f $categoryId)
Write-Output ("IMAGE_URL={0}" -f $found.image)
