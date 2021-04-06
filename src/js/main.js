var pr,sb_left,sb_right,sb_bottom,over,scene,cam,renderer,ocontrols,controls,grid,CTRL=false,COPY=null,all_objects=[],curr_sel=null,ids={cube:1,plane:1},WIN=true,PREV=null,TAxis={x:true,y:true,z:true},LIST=[],TEX=null,INP=[],GROUPS={},CGR=null
function init(){
	pr=document.getElementsByClassName("wr")[0]
	sb_left=pr.querySelectorAll(".sb-left")[0]
	sb_right=pr.querySelectorAll(".sb-right")[0]
	sb_bottom=pr.querySelectorAll(".sb-bottom")[0]
	over=pr.querySelectorAll(".over")[0]
	sb_left.classList.add("v")
	sb_right.classList.add("v")
	sb_right.querySelectorAll(".r-header")[0].onkeydown=function(e){
		if (e.keyCode==13){
			e.preventDefault()
			e.stopPropagation()
			this.blur()
			rename(curr_sel,this.innerText)
		}
	}
	for (var k of sb_right.childNodes){
		k.onblur=function(){
			if (WIN==true){return}
			WIN=true
			ocontrols.enabled=true
			controls.showX=TAxis.x
			controls.showY=TAxis.y
			controls.showZ=TAxis.z
		}
		k.onfocus=function(){
			if (WIN==false){return}
			WIN=false
			ocontrols.enabled=false
			TAxis.x=controls.showX
			TAxis.y=controls.showY
			TAxis.z=controls.showZ
			controls.showX=false
			controls.showY=false
			controls.showZ=false
		}
		if (k.type=="number"){
			k.onkeydown=function(e){
				if (e.keyCode==13){
					e.preventDefault()
					e.stopPropagation()
					this.blur()
				}
			}
		}
	}
	scene=new THREE.Scene()
	cam=new THREE.PerspectiveCamera(50,pr.offsetWidth/pr.offsetHeight,1,8000)
	cam.position.set(250,200,300)
	cam.lookAt(new THREE.Vector3(0,0,0))
	renderer=new THREE.WebGLRenderer({antialias:true})
	renderer.setSize(pr.offsetWidth,pr.offsetHeight)
	renderer.setClearColor(0x000000)
	pr.querySelectorAll(".cnv")[0].appendChild(renderer.domElement)
	scene.add(new THREE.AmbientLight(0xffffff,0.2))
	var pLight=new THREE.DirectionalLight(0xffffff,2)
	pLight.position.set(1,1,1)
	scene.add(pLight)
	pLight=new THREE.DirectionalLight(0xffffff,2)
	pLight.position.set(-1,-1,-1)
	scene.add(pLight)
	grid=new THREE.GridHelper(1000,10,0xffff00,0xcccccc)
	scene.add(grid)
	var o=create_object("cube")
	scene.add(o.mesh)
	ocontrols=new THREE.OrbitControls(cam,renderer.domElement)
	ocontrols.update()
	ocontrols.addEventListener("change",render)
	controls=new THREE.TransformControls(cam,renderer.domElement)
	controls.addEventListener("change",render)
	controls.addEventListener("dragging-changed",function(e){
		ocontrols.enabled=!e.value
		update_sel()
	})
	controls.setTranslationSnap(1)
	controls.setRotationSnap(THREE.Math.degToRad(1))
	window.addEventListener("resize",resize,false)
	window.addEventListener("keydown",function(e){
		if (WIN==false){
			if (e.keyCode==81&&!over.classList.contains("v")){
				sb_right.classList.toggle("v")
				sb_left.classList.toggle("v")
				sb_bottom.classList.toggle("h")
			}
			return
		}
		switch (e.keyCode){
			case 17: //CTRL
				controls.setTranslationSnap(50)
				controls.setRotationSnap(THREE.Math.degToRad(15))
				CTRL=true
				break
			case 87: //W
				controls.setMode("translate")
				break
			case 69: //E
				controls.setMode("rotate")
				break
			case 82: //R
				controls.setMode("scale")
				break
			case 187: case 107: //+,num+
				controls.setSize(controls.size+0.1)
				break
			case 189: case 109: //-,num-
				controls.setSize(controls.size-0.1)
				break
			case 65: //A
				controls.showX=!controls.showX
				break
			case 83: //S
				controls.showY=!controls.showY
				break
			case 68: //D
				controls.showZ=!controls.showZ
				break
			case 67: //C
				if (CTRL==true){
					COPY=curr_sel
				}
				break
			case 86: //V
				if (CTRL==true){
					paste(COPY)
				}
				break
			case 27: //Esc
				if (curr_sel!=null){
					controls.detach(curr_sel)
					curr_sel=null
					render()
					update_sel()
				}
				break
			case 81: //Q
				sb_right.classList.toggle("v")
				sb_left.classList.toggle("v")
				sb_bottom.classList.toggle("h")
				break
			case 46: //Del
				del(curr_sel)
				break
			case 78: //N
				var o=create_object("cube")
				scene.add(o.mesh)
				if (curr_sel!=null){controls.detach(curr_sel.mesh)}
				controls.attach(o.mesh)
				curr_sel=o
				update_sel()
				update_list()
				break
			case 77: //M
				var o=create_object("plane")
				scene.add(o.mesh)
				if (curr_sel!=null){controls.detach(curr_sel.mesh)}
				controls.attach(o.mesh)
				curr_sel=o
				update_sel()
				update_list()
				break
			case 71: //G
				grid.visible=!grid.visible
				render()
				break
		}
	})
	window.addEventListener("keyup",function(e){
		if (e.keyCode==17){
			controls.setTranslationSnap(1)
			controls.setRotationSnap(THREE.Math.degToRad(1))
			CTRL=false
		}
	})
	controls.attach(o.mesh)
	curr_sel=o
	update_sel()
	update_list()
	scene.add(controls)
	render()
}
function render(){
	renderer.render(scene,cam)
}
function resize(){
	cam.aspect=pr.offsetWidth/pr.offsetHeight
	cam.updateProjectionMatrix()
	renderer.setSize(pr.offsetWidth,pr.offsetHeight)
	render()
}
function paste(a){
	if (a==null){return}
	var o=create_object(a.type,...a.data().pos,...a.data().rot,...a.data().size,...a.data().tex,a.data().group)
	o.mesh.position.y+=100
	scene.add(o.mesh)
	controls.detach(curr_sel.mesh)
	controls.attach(o.mesh)
	curr_sel=o
	update_sel()
	update_list()
}
function del(o){
	if (curr_sel==null){return}
	if (o==curr_sel){controls.detach(o.mesh)}
	all_objects.splice(all_objects.indexOf(o),1)
	scene.remove(scene.getObjectByName(o.name))
	if (o==curr_sel){
		if (all_objects.length>0){
			select(all_objects[all_objects.length-1])
		}
		else{
			curr_sel=null
		}
	}
	if (COPY==o){
		COPY=null
	}
	render()
	update_sel()
	update_list()
}
function select(o){
	if (o==curr_sel){controls.detach(o.mesh)}
	curr_sel=o
	controls.attach(curr_sel.mesh)
	update_sel()
	update_list()
}
function rename(o,n){
	var c=0
	for (var k of all_objects){
		if (k==o){continue}
		var a=k.name+"",b=0
		while (true){
			if (a[a.length-1]!="_"){break}
			a=a.substring(0,a.length-1)
			b++
		}
		if (a==n){
			c=b+1
		}
	}
	for (var i=0;i<c;i++){
		n+="_"
	}
	o.name=n
	o.mesh.name=n
	update_sel()
	update_list()
	return o
}
function create_object(type,x,y,z,a,b,c,w,h,d,A,B,C,D,E,F,gr){
	type=type||"cube"
	gr=gr||"body"
	if (type=="cube"){
		var mesh=new THREE.Mesh(new THREE.BoxBufferGeometry(1,1,1),[
			new THREE.MeshStandardMaterial({color:0xff0000,side:THREE.DoubleSide,metalness:0,roughness:1}),
			new THREE.MeshStandardMaterial({color:0x550000,side:THREE.DoubleSide,metalness:0,roughness:1}),
			new THREE.MeshStandardMaterial({color:0x00ff00,side:THREE.DoubleSide,metalness:0,roughness:1}),
			new THREE.MeshStandardMaterial({color:0x005500,side:THREE.DoubleSide,metalness:0,roughness:1}),
			new THREE.MeshStandardMaterial({color:0x0000ff,side:THREE.DoubleSide,metalness:0,roughness:1}),
			new THREE.MeshStandardMaterial({color:0x000055,side:THREE.DoubleSide,metalness:0,roughness:1})
		])
		mesh.name=`Cube#${ids.cube}`
		ids.cube++
	}
	else{
		var mesh=new THREE.Mesh(new THREE.PlaneBufferGeometry(1,1),new THREE.MeshStandardMaterial({color:0xff0000,side:THREE.DoubleSide,metalness:0,roughness:1}),)
		mesh.name=`Plane#${ids.plane}`
		ids.plane++
	}
	var o={
		mesh:mesh,
		name:mesh.name,
		type:type,
		group:gr,
		pos:function(x,y,z){
			x=x||0
			y=y||0
			z=z||0
			this.mesh.position.set(x,y,z)
		},
		rot:function(a,b,c){
			a=a||0
			b=b||0
			c=c||0
			this.mesh.rotation.set(a,b,c)
		},
		size:function(w,h,d){
			w=w||100
			h=h||100
			d=d||100
			this.mesh.scale.set(w,h,d)
		},
		tex:function(a,b,c,d,e,f){
			if (this.type=="cube"){
				a=a||this.mesh.material[0]
				b=b||this.mesh.material[1]
				c=c||this.mesh.material[2]
				d=d||this.mesh.material[3]
				e=e||this.mesh.material[4]
				f=f||this.mesh.material[5]
				this.mesh.material=[a,b,c,d,e,f]
			}
			else{
				a=a||this.mesh.material
				this.mesh.material=a
			}
		},
		grp:function(gr){
			gr=gr||"body"
			this.mesh.gr=gr
			this.group=gr
		},
		data:function(){
			return {
				rot:[
					this.mesh.rotation.x,
					this.mesh.rotation.y,
					this.mesh.rotation.z
				],
				pos:[
					this.mesh.position.x,
					this.mesh.position.y,
					this.mesh.position.z
				],
				size:[
					this.mesh.scale.x,
					this.mesh.scale.y,
					this.mesh.scale.z
				],
				tex:Array.isArray(this.mesh.material)?this.mesh.material.slice():[this.mesh.material],
				group:this.gr
			}
		}
	}
	o.pos(x,y,z)
	o.rot(a,b,c)
	o.size(w,h,d)
	o.tex(A,B,C,D,E,F)
	o.grp(gr)
	all_objects.push(o)
	GROUPS[gr]=GROUPS[gr]||[]
	GROUPS[gr].push(o)
	return o
}
function focus_current(){
	if (curr_sel==null){return}
	var pd=curr_sel.data().pos
	ocontrols.target=new THREE.Vector3(...pd)
	ocontrols.cameraTarget=ocontrols.target
	cam.position.set(pd[0]+250,pd[1]+200,pd[2]+300)
	cam.lookAt(new THREE.Vector3(...pd))
	if (PREV!=null){
		PREV.ct.cameraTarget=new THREE.Vector3(0,0,0)
		PREV.cm.position.set(175,150,200)
		PREV.cm.lookAt(new THREE.Vector3(0,0,0))
	}
	render()
}
function update_sel(){
	var o=curr_sel
	if (o==null){
		sb_right.classList.add("h")
		return
	}
	sb_right.classList.remove("h")
	sb_right.querySelectorAll(".r-header")[0].innerText=o.name
	var dt=o.data()
	o.pos(parseInt(dt.pos[0]),parseInt(dt.pos[1]),parseInt(dt.pos[2]))
	o.rot(parseInt(dt.rot[0]/(Math.PI/180))*(Math.PI/180),parseInt(dt.rot[1]/(Math.PI/180))*(Math.PI/180),parseInt(dt.rot[2]/(Math.PI/180))*(Math.PI/180))
	o.size(parseInt(dt.size[0]),parseInt(dt.size[1]),parseInt(dt.size[2]))
	o.tex()
	sb_right.querySelectorAll(".r-pos-x")[0].value=dt.pos[0]
	sb_right.querySelectorAll(".r-pos-y")[0].value=dt.pos[1]
	sb_right.querySelectorAll(".r-pos-z")[0].value=dt.pos[2]
	sb_right.querySelectorAll(".r-rot-x")[0].value=Math.round(dt.rot[0]/(Math.PI/180))
	sb_right.querySelectorAll(".r-rot-y")[0].value=Math.round(dt.rot[1]/(Math.PI/180))
	sb_right.querySelectorAll(".r-rot-z")[0].value=Math.round(dt.rot[2]/(Math.PI/180))
	sb_right.querySelectorAll(".r-size-x")[0].value=dt.size[0]
	sb_right.querySelectorAll(".r-size-y")[0].value=dt.size[1]
	sb_right.querySelectorAll(".r-size-z")[0].value=dt.size[2]
	prev(o)
}
function prev(o){
	if (PREV==null){
		var sc=new THREE.Scene()
		var cm=new THREE.PerspectiveCamera(50,280/280,1,1000)
		cm.position.set(175,150,200)
		cm.lookAt(new THREE.Vector3(0,0,0))
		var rd=new THREE.WebGLRenderer({antialias:true})
		rd.setSize(280,280)
		rd.setClearColor(0x000000)
		sb_right.querySelectorAll(".r-prev")[0].appendChild(rd.domElement)
		sc.add(new THREE.AmbientLight(0xffffff,0.2))
		var pLight=new THREE.DirectionalLight(0xffffff,2)
		pLight.position.set(1,1,1)
		sc.add(pLight)
		pLight=new THREE.DirectionalLight(0xffffff,2)
		pLight.position.set(-1,-1,-1)
		sc.add(pLight)
		var ct=new THREE.OrbitControls(cm,rd.domElement)
		ct.enablePan=false
		PREV={
			sc:sc,
			cm:cm,
			ct:ct,
			rd:rd,
			box:create_object(o.type),
			update:function(){
				PREV.rd.render(PREV.sc,PREV.cm)
				requestAnimationFrame(PREV.update)
			}
		}
		ids[o.type]--
		all_objects.splice(all_objects.indexOf(PREV.box),1)
		GROUPS[o.group].splice(GROUPS[o.group].indexOf(o),1)
		sc.add(PREV.box.mesh)
		PREV.box.mesh.name="preview"
		PREV.box.name="preview"
		requestAnimationFrame(PREV.update)
	}
	if (o.type!=PREV.box.type){
		PREV.sc.remove(PREV.sc.getObjectByName(PREV.box.name))
		try{
			PREV.box.mesh.material.dispose()
		}
		catch (e){
			for (var k of PREV.box.mesh.material){
				k.dispose()
			}
		}
		PREV.box.mesh.geometry.dispose()
		PREV.box=create_object(o.type)
		ids[o.type]--
		all_objects.splice(all_objects.indexOf(PREV.box),1)
		GROUPS[o.group].splice(GROUPS[o.group].indexOf(o),1)
		PREV.sc.add(PREV.box.mesh)
		PREV.box.mesh.name="preview"
		PREV.box.name="preview"
	}
	PREV.box.rot(...o.data().rot)
	PREV.box.size(...o.data().size)
	var sdt=curr_sel.data().size,sc=Math.max(...sdt)
	if (curr_sel.type=="plane"){sc=Math.max(sdt[0],sdt[1])}
	PREV.box.size(sdt[0]/sc*125,sdt[1]/sc*125,sdt[2]/sc*125)
	PREV.rd.render(PREV.sc,PREV.cm)
}
function update_prev(){
	if (PREV==null){return}
	curr_sel.pos(parseInt(sb_right.querySelectorAll(".r-pos-x")[0].value),parseInt(sb_right.querySelectorAll(".r-pos-y")[0].value),parseInt(sb_right.querySelectorAll(".r-pos-z")[0].value))
	curr_sel.rot(parseInt(sb_right.querySelectorAll(".r-rot-x")[0].value)*(Math.PI/180),parseInt(sb_right.querySelectorAll(".r-rot-y")[0].value)*(Math.PI/180),parseInt(sb_right.querySelectorAll(".r-rot-z")[0].value)*(Math.PI/180))
	curr_sel.size(parseInt(sb_right.querySelectorAll(".r-size-x")[0].value),parseInt(sb_right.querySelectorAll(".r-size-y")[0].value),parseInt(sb_right.querySelectorAll(".r-size-z")[0].value))
	var dt=curr_sel.data()
	curr_sel.pos(parseInt(dt.pos[0]),parseInt(dt.pos[1]),parseInt(dt.pos[2]))
	curr_sel.rot(parseInt(dt.rot[0]/(Math.PI/180))*(Math.PI/180),parseInt(dt.rot[1]/(Math.PI/180))*(Math.PI/180),parseInt(dt.rot[2]/(Math.PI/180))*(Math.PI/180))
	curr_sel.size(parseInt(dt.size[0]),parseInt(dt.size[1]),parseInt(dt.size[2]))
	var dt=curr_sel.data()
	sb_right.querySelectorAll(".r-pos-x")[0].value=dt.pos[0]
	sb_right.querySelectorAll(".r-pos-y")[0].value=dt.pos[1]
	sb_right.querySelectorAll(".r-pos-z")[0].value=dt.pos[2]
	sb_right.querySelectorAll(".r-rot-x")[0].value=Math.round(dt.rot[0]/(Math.PI/180))
	sb_right.querySelectorAll(".r-rot-y")[0].value=Math.round(dt.rot[1]/(Math.PI/180))
	sb_right.querySelectorAll(".r-rot-z")[0].value=Math.round(dt.rot[2]/(Math.PI/180))
	sb_right.querySelectorAll(".r-size-x")[0].value=dt.size[0]
	sb_right.querySelectorAll(".r-size-y")[0].value=dt.size[1]
	sb_right.querySelectorAll(".r-size-z")[0].value=dt.size[2]
	PREV.box.rot(...curr_sel.data().rot,true)
	var sdt=curr_sel.data().size,sc=Math.max(...sdt)
	if (curr_sel.type=="plane"){sc=Math.max(sdt[0],sdt[1])}
	PREV.box.size(sdt[0]/sc*125,sdt[1]/sc*125,sdt[2]/sc*125)
	render()
}
function get_short(nm){
	var num="",n="0123456789".split("")
	for (var ki=nm.length-1;ki>=0;ki--){
		if (n.includes(nm[ki])){num=nm[ki]+num}
		else{break}
	}
	nm=nm.substring(0,ki+1)
	if (nm.length+num.length<4){return nm+num}
	var v="aeiouy".split(""),str="",fv=""
	for (var k of nm){
		if (!v.includes(k)){str+=k}
		else if (fv==""){fv=k}
		if (str.length==2){return str+num}
	}
	if (str.length==0){return nm.substring(0,2)+num}
	else if (str.length==1){return str+fv+num}
	return str+num
}
function update_list(){
	var lst=sb_left.querySelectorAll(".l-list")[0]
	for (var k of LIST){
		lst.removeChild(k.el)
	}
	LIST=[]
	for (var k of all_objects){
		var d=document.createElement("div")
		d.classList.add("l-item")
		d.classList.add(k.type=="cube"?"c":"p")
		var j=document.createElement("div")
		j.classList.add("l-itext")
		j.innerHTML=k.name
		d.appendChild(j)
		var l=document.createElement("div")
		l.classList.add("l-igroup")
		l.innerHTML=get_short(k.group)
		if (k.group=="body"){
			l.classList.add("body")
		}
		d.appendChild(l)
		d.id=LIST.length
		d.onclick=function(){
			select(LIST[this.id].obj)
		}
		lst.appendChild(d)
		LIST.push({
			obj:k,
			el:d
		})
	}
}
function change_textures(){
	if (TEX!=null){
		sb_right.childNodes[0].onblur()
		update_tex()
		sb_bottom.querySelectorAll(".b-wr")[0].innerHTML=""
		sb_bottom.classList.remove("v")
		TEX=null
		for (var i of INP){
			i.parentNode.removeChild(i)
		}
		return
	}
	sb_right.childNodes[0].onfocus()
	sb_bottom.classList.add("v")
	if (curr_sel.type=="cube"){
		TEX={
			dt:[],
			target:null
		}
		var a=["Front","Top","Left","Back","Bottom","Right"]
		for (var ki of [0,2,4,1,3,5]){
			var k=curr_sel.mesh.material[ki]
			var d=document.createElement("div")
			d.classList.add("b-tex")
			d.id=TEX.dt.length
			d.onclick=function(){
				TEX.target=parseInt(this.id)
				over.classList.add("v")
				over.classList.add("tex")
			}
			var i=document.createElement("div")
			i.classList.add("b-tex-header")
			i.innerText=a.shift()
			d.appendChild(i)
			var j=document.createElement("img")
			j.classList.add("b-tex-i")
			if (k.map==null){
				j.style.backgroundColor=`#${(k.color.r*255).toString(16).length==1?(k.color.r*255).toString(16)+"0":(k.color.r*255).toString(16)}${(k.color.g*255).toString(16).length==1?(k.color.g*255).toString(16)+"0":(k.color.g*255).toString(16)}${(k.color.b*255).toString(16).length==1?(k.color.b*255).toString(16)+"0":(k.color.b*255).toString(16)}`
				j.cId=`#${(k.color.r*255).toString(16).length==1?(k.color.r*255).toString(16)+"0":(k.color.r*255).toString(16)}${(k.color.g*255).toString(16).length==1?(k.color.g*255).toString(16)+"0":(k.color.g*255).toString(16)}${(k.color.b*255).toString(16).length==1?(k.color.b*255).toString(16)+"0":(k.color.b*255).toString(16)}`
			}
			else{
				j.src=k.dt
			}
			d.appendChild(j)
			sb_bottom.querySelectorAll(".b-wr")[0].appendChild(d)
			TEX.dt.push({
				el:d,
				tex:k
			})
		}
	}
	else{
		var k=curr_sel.mesh.material
		var d=document.createElement("div")
		d.classList.add("b-tex")
		d.onclick=function(){
			over.classList.add("v")
			over.classList.add("tex")
		}
		var i=document.createElement("div")
		i.classList.add("b-tex-header")
		i.innerText="All"
		d.appendChild(i)
		var j=document.createElement("img")
		j.classList.add("b-tex-i")
		if (k.map==null){
			j.style.backgroundColor=`#${(k.color.r*255).toString(16).length==1?(k.color.r*255).toString(16)+"0":(k.color.r*255).toString(16)}${(k.color.g*255).toString(16).length==1?(k.color.g*255).toString(16)+"0":(k.color.g*255).toString(16)}${(k.color.b*255).toString(16).length==1?(k.color.b*255).toString(16)+"0":(k.color.b*255).toString(16)}`
			j.cId=`#${(k.color.r*255).toString(16).length==1?(k.color.r*255).toString(16)+"0":(k.color.r*255).toString(16)}${(k.color.g*255).toString(16).length==1?(k.color.g*255).toString(16)+"0":(k.color.g*255).toString(16)}${(k.color.b*255).toString(16).length==1?(k.color.b*255).toString(16)+"0":(k.color.b*255).toString(16)}`
		}
		else{
			j.src=k.dt
		}
		d.appendChild(j)
		sb_bottom.querySelectorAll(".b-wr")[0].appendChild(d)
		TEX={
			dt:[
				{
					el:d,
					tex:k
				}
			],
			target: 0
		}
	}
}
function update_tex(){
	if (curr_sel.type=="cube"){
		for (var ki of [0,2,4,1,3,5]){
			var k=TEX.dt[[0,2,4,1,3,5].indexOf(ki)]
			curr_sel.mesh.material[ki]=k.tex
			if (PREV!=null){
				PREV.box.mesh.material[ki]=k.tex
			}
		}
	}
	else{
		curr_sel.mesh.material=TEX.dt[0].tex
		PREV.box.mesh.material=TEX.dt[0].tex
	}
	render()
}
function set_tex_type(t){
	over.classList.remove("v")
	over.classList.remove("tex")
	var inp=document.createElement("input")
	inp.style.display="none"
	inp.type=["color","file"][t]
	inp.setAttribute("value",TEX.dt[TEX.target].el.querySelectorAll(".b-tex-i")[0].cId)
	document.body.appendChild(inp)
	inp.addEventListener("change",function(e){
		this.parentNode.removeChild(this)
		INP.splice(INP.indexOf(this),1)
		if (this.type=="color"){
			TEX.dt[TEX.target].tex=new THREE.MeshStandardMaterial({color:eval("0x"+this.value.substring(1)),side:THREE.DoubleSide,metalness:0,roughness:1,refractionRatio:0})
			TEX.dt[TEX.target].el.removeChild(TEX.dt[TEX.target].el.querySelectorAll(".b-tex-i")[0])
			var j=document.createElement("img")
			j.classList.add("b-tex-i")
			j.style.backgroundColor=this.value
			j.cId=this.value
			TEX.dt[TEX.target].el.appendChild(j)
			TEX.dt[TEX.target].el.querySelectorAll(".b-tex-i")[0].style.backgroundColor=this.value
			TEX.dt[TEX.target].el.querySelectorAll(".b-tex-i")[0].cId=this.value
			update_tex()
		}
		else{
			var f=e.target.files[0]
			if (f==undefined){
				update_tex()
				return
			}
			var r=new FileReader()
			r.readAsDataURL(f)
			r.onload=function(){
				TEX.dt[TEX.target].el.querySelectorAll(".b-tex-i")[0].style.backgroundColor="transparent"
				TEX.dt[TEX.target].el.querySelectorAll(".b-tex-i")[0].src=this.result
				var tex=new THREE.TextureLoader().load(this.result)
				tex.src=this.result
				TEX.dt[TEX.target].tex=new THREE.MeshStandardMaterial({map:tex,side:THREE.DoubleSide,metalness:0,roughness:1,refractionRatio:0})
				TEX.dt[TEX.target].tex.dt=this.result
				update_tex()
			}
		}
	},false)
	inp.click()
	INP.push(inp)
}
function change_group(){
	sb_right.childNodes[0].onfocus()
	CGR=curr_sel
	over.classList.add("v")
	over.classList.add("gr")
	over.querySelectorAll(".o-box2")[0].querySelectorAll(".o-text")[0].value=CGR.group
	over.querySelectorAll(".o-box2")[0].querySelectorAll(".o-text")[0].onkeydown=set_group
}
function set_group(e){
	if (e.keyCode!=13){return}
	GROUPS[CGR.group].splice(GROUPS[CGR.group].indexOf(CGR),1)
	if (GROUPS[CGR.group].length==0){delete GROUPS[CGR.group]}
	CGR.grp(over.querySelectorAll(".o-box2")[0].querySelectorAll(".o-text")[0].value.toLowerCase())
	GROUPS[CGR.group]=GROUPS[CGR.group]||[]
	GROUPS[CGR.group].push(CGR)
	sb_right.childNodes[0].onblur()
	over.classList.remove("v")
	over.classList.remove("gr")
	CGR=null
	update_list()
}
function save(){
	var d={
		tex: [],
		model: []
	},atx=[]
	for (var o of all_objects){
		var a=o.mesh.material
		if (!Array.isArray(o.mesh.material)){
			a=[a]
		}
		for (var k of a){
			k={
				type: k.map==null?"color":"texture",
				data: k.map==null?`#${(k.color.r*255).toString(16).length==1?(k.color.r*255).toString(16)+"0":(k.color.r*255).toString(16)}${(k.color.g*255).toString(16).length==1?(k.color.g*255).toString(16)+"0":(k.color.g*255).toString(16)}${(k.color.b*255).toString(16).length==1?(k.color.b*255).toString(16)+"0":(k.color.b*255).toString(16)}`:k.map.src
			}
			var s=true
			for (var j of atx){
				if (j.type==k.type&&j.data==k.data){
					s=false
					break
				}
			}
			if (s==true){
				atx.push(k)
			}
		}
	}
	d.texture=atx
	for (var o of all_objects){
		var dt=o.data(),tex=[]
		var a=o.mesh.material
		if (!Array.isArray(o.mesh.material)){
			a=[a]
		}
		for (var k of a){
			k={
				type: k.map==null?"color":"texture",
				data: k.map==null?`#${(k.color.r*255).toString(16).length==1?(k.color.r*255).toString(16)+"0":(k.color.r*255).toString(16)}${(k.color.g*255).toString(16).length==1?(k.color.g*255).toString(16)+"0":(k.color.g*255).toString(16)}${(k.color.b*255).toString(16).length==1?(k.color.b*255).toString(16)+"0":(k.color.b*255).toString(16)}`:k.map.src
			}
			var i=0
			for (var j of d.texture){
				if (j.type==k.type&&j.data==k.data){
					tex.push(i)
					break
				}
				i++
			}
		}
		if (tex.length==1){tex=tex[0]}
		d.model.push({
			type: o.type,
			name: o.name,
			group: o.group,
			x: dt.pos[0],
			y: dt.pos[1],
			z: dt.pos[2],
			rx: Math.round(dt.rot[0]*(180/Math.PI)),
			ry: Math.round(dt.rot[1]*(180/Math.PI)),
			rz: Math.round(dt.rot[2]*(180/Math.PI)),
			w: dt.size[0],
			h: dt.size[1],
			d: dt.size[2],
			texture: tex
		})
	}
	return JSON.stringify(d,null,4).replace(/ {4}/g,"\t")
}
document.addEventListener("DOMContentLoaded",init)
