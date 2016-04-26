export default function LeafNode(hcode, key, value) {
  this.hcode = hcode;
  this.key = key;
  this.value = value;
  this.isLeaf = true;
}
