param([string]$path = 'C:\xampp\htdocs\motomaster\models\NEW_CARWITHENGINE.glb')
$d = [System.IO.File]::ReadAllBytes($path)
$ln = [BitConverter]::ToUInt32($d, 12)
$json = [System.Text.Encoding]::UTF8.GetString($d, 20, $ln)
$j = $json | ConvertFrom-Json

function Node-Matrix {
    param($node)
    if ($node.matrix) {
        return ,([double[]]($node.matrix))
    }
    $t = @(0.0,0.0,0.0); if ($node.translation) { $t = [double[]]$node.translation }
    $q = @(0.0,0.0,0.0,1.0); if ($node.rotation) { $q = [double[]]$node.rotation }
    $s = @(1.0,1.0,1.0); if ($node.scale) { $s = [double[]]$node.scale }
    $x=$q[0];$y=$q[1];$z=$q[2];$w=$q[3]
    $m = New-Object 'double[]' 16
    $m[0]=(1-2*($y*$y+$z*$z))*$s[0]; $m[1]=2*($x*$y+$w*$z)*$s[0]; $m[2]=2*($x*$z-$w*$y)*$s[0]; $m[3]=0
    $m[4]=2*($x*$y-$w*$z)*$s[1]; $m[5]=(1-2*($x*$x+$z*$z))*$s[1]; $m[6]=2*($y*$z+$w*$x)*$s[1]; $m[7]=0
    $m[8]=2*($x*$z+$w*$y)*$s[2]; $m[9]=2*($y*$z-$w*$x)*$s[2]; $m[10]=(1-2*($x*$x+$y*$y))*$s[2]; $m[11]=0
    $m[12]=$t[0];$m[13]=$t[1];$m[14]=$t[2];$m[15]=1
    return ,$m
}

function Mul-Mat {
    param([double[]]$a, [double[]]$b)
    $r = New-Object 'double[]' 16
    for ($c=0; $c -lt 4; $c++) {
        for ($ri=0; $ri -lt 4; $ri++) {
            $sum=0.0
            for ($k=0; $k -lt 4; $k++) { $sum += $a[$k*4+$ri]*$b[$c*4+$k] }
            $r[$c*4+$ri]=$sum
        }
    }
    return ,$r
}

function Xform-Point {
    param([double[]]$m, [double[]]$v)
    $x=$v[0];$y=$v[1];$z=$v[2]
    $rx = $m[0]*$x+$m[4]*$y+$m[8]*$z+$m[12]
    $ry = $m[1]*$x+$m[5]*$y+$m[9]*$z+$m[13]
    $rz = $m[2]*$x+$m[6]*$y+$m[10]*$z+$m[14]
    return ,([double[]]@($rx,$ry,$rz))
}

$ident = New-Object 'double[]' 16
$ident[0]=1;$ident[5]=1;$ident[10]=1;$ident[15]=1

$out = New-Object System.Collections.ArrayList

function Walk {
    param([int]$idx, [double[]]$parentM, [int]$depth)
    $node = $j.nodes[$idx]
    $lm = Node-Matrix $node
    $m = Mul-Mat $parentM $lm
    $name = if ($node.name) { $node.name } else { "(unnamed#$idx)" }
    $line = ("{0}{1} pos=({2:F3},{3:F3},{4:F3})" -f ('  '*$depth), $name, $m[12],$m[13],$m[14])
    if ($null -ne $node.mesh) {
        $mesh = $j.meshes[$node.mesh]
        $pi = 0
        foreach ($p in $mesh.primitives) {
            $acc = $j.accessors[$p.attributes.POSITION]
            if ($acc.min -and $acc.max) {
                $mn = Xform-Point $m ([double[]]$acc.min)
                $mx = Xform-Point $m ([double[]]$acc.max)
                $lo = @([Math]::Min($mn[0],$mx[0]),[Math]::Min($mn[1],$mx[1]),[Math]::Min($mn[2],$mx[2]))
                $hi = @([Math]::Max($mn[0],$mx[0]),[Math]::Max($mn[1],$mx[1]),[Math]::Max($mn[2],$mx[2]))
                $line += (" [m#{0} bbox=({1:F2},{2:F2},{3:F2})-({4:F2},{5:F2},{6:F2})]" -f $node.mesh,$lo[0],$lo[1],$lo[2],$hi[0],$hi[1],$hi[2])
            } else {
                $line += (" [m#{0}]" -f $node.mesh)
            }
            $pi++
        }
    }
    [void]$out.Add($line)
    foreach ($c in $node.children) { Walk $c $m ($depth+1) }
}

$roots = $j.scenes[$j.scene].nodes
foreach ($r in $roots) { Walk ([int]$r) $ident 0 }
$out | ForEach-Object { $_ }
