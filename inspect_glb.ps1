param([string]$path = 'C:\xampp\htdocs\motomaster\models\NEW_CARWITHENGINE.glb')
$d = [System.IO.File]::ReadAllBytes($path)
$ln = [BitConverter]::ToUInt32($d, 12)
$json = [System.Text.Encoding]::UTF8.GetString($d, 20, $ln)
$j = $json | ConvertFrom-Json
# mesh 157 belongs to node "Oil_cap"; print its primitive accessor bounds
$mesh = $j.meshes[157]
foreach ($p in $mesh.primitives) {
    $acc = $j.accessors[$p.attributes.POSITION]
    Write-Output ("prim material=" + $p.material + " min=" + ($acc.min -join ',') + " max=" + ($acc.max -join ','))
    if ($null -ne $p.material) { Write-Output ("  material: " + ($j.materials[$p.material] | ConvertTo-Json -Compress)) }
}
