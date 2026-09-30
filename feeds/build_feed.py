import json,re,html,sys
EMOJI=re.compile('[\U0001F000-\U0001FAFF\u2600-\u27BF\u2B00-\u2BFF\uFE0F\u200D\u2934\u2935]')
src=sys.argv[1]
d=json.load(open(src))['data']
SKIP=('⚙️','📞')
def desc_text(h):
    parts=re.split(r'(?=<p><strong>)',h); out=[]
    for p in parts:
        m=re.match(r'<p><strong>(.*?)</strong></p>',p)
        if m and m.group(1).strip().startswith(SKIP): continue
        t=re.sub(r'</(p|li|h\d|ol|ul)>','\n',p); t=re.sub(r'<li>','• ',t)
        t=html.unescape(re.sub(r'<[^>]+>','',t)); t=re.sub(r'[ \t]+',' ',t)
        t=EMOJI.sub('',t); t=re.sub(r'[ \t]+',' ',t); t=re.sub(r'\n\s*\n+','\n',t).strip(); out.append(t)
    return '\n'.join(x for x in out if x)[:4900]
rows=[]; C=['SA','AE','KW','OM','JO']
for p in d:
    if p['status']!='sale' or not p['quantity'] or 'GEMINI' in (p['sku'] or ''): continue
    reg=p['regular_price']['amount']; cur=p['price']['amount']
    rows.append({'id':str(p['id']),'title':p['name'][:150],'description':desc_text(p['description']),
     'link':p['urls']['customer'],'image_link':p['images'][0]['url'] if p.get('images') else p['main_image'],
     'availability':'in_stock','price':f"{reg:.2f} SAR",'sale_price':f"{cur:.2f} SAR" if reg>cur else '',
     'brand':p['brand']['name'] if p.get('brand') else 'Ocean Games','condition':'new','identifier_exists':'no',
     'mpn':p['sku'] or '','product_type':' > '.join(c['name'] for c in p.get('categories',[])),
     'shipping':','.join(f'{c}:::0.00 SAR' for c in C)})
cols=['id','title','description','link','image_link','availability','price','sale_price','brand','condition','identifier_exists','mpn','product_type','shipping']
with open('feeds/google-merchant.tsv','w',encoding='utf-8') as f:
    f.write('\t'.join(cols)+'\n')
    for r in rows: f.write('\t'.join(r[c].replace('\t',' ').replace('\n',' ') for c in cols)+'\n')
print(len(rows),'rows'); print([r['id'] for r in rows]); print('hamza:',sum('أوشن' in r['description'] for r in rows))
